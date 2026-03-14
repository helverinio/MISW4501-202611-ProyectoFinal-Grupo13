# Flujo de Pagos

Este documento describe el flujo completo de pagos en el sistema de reservas de hotel, incluyendo la integración entre microservicios y servicios externos.

## Arquitectura General

El sistema de pagos está compuesto por los siguientes componentes:

- **Gateway**: Punto de entrada principal que coordina las llamadas entre servicios.
- **Pagos Service**: Microservicio responsable de gestionar los pagos internos.
- **Ext-Payments Service**: Servicio externo que maneja el procesamiento real de pagos (simula Stripe/PayPal).
- **Reservas Service**: Microservicio que gestiona las reservas y se coordina con pagos.
- **Message Queue (MQ)**: Sistema de mensajería para comunicación asíncrona entre servicios.

## Flujo de Pagos Detallado

### 1. Creación de Reserva
- El usuario solicita una reserva a través del Gateway.
- El Gateway valida la solicitud y llama al Reservas Service.
- El Reservas Service verifica disponibilidad y crea una reserva en estado "pendiente".

### 2. Registro del Pago
- Una vez creada la reserva, el usuario inicia el proceso de pago.
- El Gateway llama al endpoint `POST /api/v1/payments` del Pagos Service con:
  - `reservation_id`: ID de la reserva
  - `amount`: Monto a pagar
  - `currency`: Moneda (por defecto USD)
  - `payment_method`: Método de pago
  - `description`: Descripción opcional

### 3. Creación del Payment Intent
- El Pagos Service valida que no exista un pago previo para la reserva.
- Llama al Ext-Payments Service para crear un payment intent:
  - `POST /api/v1/payment-intents` con amount, currency, description, webhook_url, reservation_id
- El Ext-Payments Service crea el intent y devuelve un `payment_intent_id`.
- El Pagos Service guarda el pago localmente con status "pendiente".

### 4. Procesamiento del Pago
- El usuario confirma el pago (por ejemplo, ingresa datos de tarjeta).
- El Gateway llama al endpoint `POST /api/v1/payments/{payment_id}/process` del Pagos Service.
- El Pagos Service bloquea el pago para procesamiento (evita doble procesamiento).
- Llama al Ext-Payments Service para procesar el pago:
  - `POST /api/v1/payments` con payment_intent_id y payment_method

### 5. Confirmación del Pago
- El Ext-Payments Service procesa el pago externamente.
- Una vez procesado, envía una actualización de status vía:
  - **Webhook** (legacy): `POST /api/v1/payments/webhook` al Pagos Service
  - **MQ Event** (preferido): Publica evento `PaymentStatusUpdatedEvent` en la cola de mensajes
- El Pagos Service recibe el evento y actualiza el status del pago a "completado" o "fallido".

### 6. Confirmación de Reserva
- Si el pago es exitoso, el Reservas Service recibe notificación (vía MQ o consulta directa).
- Actualiza el status de la reserva a "confirmada".
- Envía notificaciones al usuario (email, etc.).

## Estados del Pago

- **pendiente**: Pago registrado pero no procesado.
- **procesando**: Pago en proceso de validación externa.
- **completado**: Pago exitoso.
- **fallido**: Pago rechazado o error.
- **cancelado**: Pago cancelado por el usuario.

## Manejo de Errores y Resiliencia

- **Circuit Breaker**: Implementado en llamadas al Ext-Payments Service para evitar cascadas de fallos.
- **Reintentos**: Mensajes MQ se reintentan hasta un máximo configurable.
- **DLQ (Dead Letter Queue)**: Mensajes fallidos van a una cola de mensajes muertos para análisis.
- **Locking**: Pagos se bloquean durante procesamiento para evitar concurrencia.

## Endpoints Principales

### Pagos Service
- `POST /api/v1/payments` - Registrar pago
- `POST /api/v1/payments/{id}/process` - Procesar pago
- `GET /api/v1/payments/{id}` - Obtener pago
- `GET /api/v1/payments/reservation/{reservation_id}` - Obtener pago por reserva

### Ext-Payments Service
- `POST /api/v1/payment-intents` - Crear intent de pago
- `POST /api/v1/payments` - Procesar pago
- `GET /api/v1/payments/{id}` - Obtener pago

## Comunicación Asíncrona

Los servicios se comunican vía RabbitMQ con los siguientes exchanges/topics:
- `payment.status.updated` - Actualizaciones de status de pago
- `reservation.status.updated` - Actualizaciones de status de reserva

## Diagrama de Secuencia

```plantuml
@startuml Flujo de Pagos
actor Usuario
participant Gateway
participant "Pagos Service" as PS
participant "Ext-Payments Service" as EPS
participant "Reservas Service" as RS
participant MQ

== Creación de Reserva ==
Usuario -> Gateway: Solicitar reserva
Gateway -> RS: Crear reserva
RS --> Gateway: Reserva creada (pendiente)
Gateway --> Usuario: Reserva pendiente

== Registro de Pago ==
Usuario -> Gateway: Iniciar pago
Gateway -> PS: POST /payments (reservation_id, amount, etc.)
PS -> PS: Validar no existe pago previo
PS -> EPS: POST /payment-intents
EPS --> PS: payment_intent_id
PS -> PS: Guardar pago (status: pendiente)
PS --> Gateway: Pago registrado
Gateway --> Usuario: Pago pendiente

== Procesamiento de Pago ==
Usuario -> Gateway: Confirmar pago
Gateway -> PS: POST /payments/{id}/process
PS -> PS: Lock para procesamiento
PS -> EPS: POST /payments
EPS --> PS: Pago procesado
EPS -> MQ: Publicar PaymentStatusUpdatedEvent
MQ --> PS: Recibir evento
PS -> PS: Actualizar status a completado/fallido
PS --> Gateway: Status actualizado

== Confirmación de Reserva ==
PS -> MQ: Publicar PaymentStatusUpdatedEvent
MQ --> RS: Recibir evento
RS -> RS: Actualizar reserva a confirmada
RS --> Usuario: Reserva confirmada

@enduml
```</content>
<parameter name="filePath">README_PAGOS.md