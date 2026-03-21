# ADR-002 – Pagos asíncronos

## Estado: Aceptado

## Contexto

El sistema original tenía pagos acoplados sincrónicamente: si el PSP fallaba, toda la reserva fallaba, y la latencia de la UI dependía del PSP. Los requerimientos exigen:
- Desacoplar completamente el flujo de reserva del flujo de pago
- Garantizar idempotencia (no cobros duplicados)
- Tolerar fallos del PSP sin impactar la experiencia del usuario
- Detectar pagos que no se completaron (abandono)

---

## Decisión

Arquitectura de pagos en dos fases con mensajería asíncrona (ActiveMQ STOMP):

### Flujo implementado

**Fase 1 — Registro (síncrono, parte de crear reserva)**:
1. `reservas` llama a `pagos` vía HTTP (circuit breaker)
2. `pagos` verifica idempotencia por `reservation_id`
3. `pagos` crea PaymentIntent en `ext-payments`
4. `pagos` guarda payment con status `pendiente`

**Fase 2 — Procesamiento (asíncrono)**:
1. Cliente llama `POST /api/v1/payments/{id}/process`
2. `pagos` hace lock optimista: `UPDATE WHERE status='pendiente'` → `'procesando'`
3. `pagos` llama a `ext-payments` que ejecuta el pago
4. `ext-payments` notifica vía webhook asíncrono (background thread)
5. Webhook llega a `gateway` → `reservas` → actualiza estado del pago shadow

**Fase de abandono (background scheduler)**:
- Scheduler en `pagos` corre cada 60 segundos
- Marca como `abandonado` cualquier payment con `status='pendiente'` y `created_at < now - 20 min`
- Publica evento a ActiveMQ `/topic/PaymentStatusUpdated`

### Mensajería ActiveMQ

| Destino | Dirección | Descripción |
|---------|-----------|-------------|
| `/topic/PaymentStatusUpdated` | Publisher: `pagos` | Notifica cambios de estado de pago |
| `/queue/PaymentStatusUpdated` | Subscriber: `reservas` y `pagos` | Recibe actualizaciones de estado |
| `/topic/PaymentStatusUpdated.DLQ` | DLQ: ambos servicios | Mensajes fallidos tras 3 reintentos |

**Retry**: header `x-retry-count` incrementado en cada intento; tras `MQ_MAX_RETRIES=3` → DLQ.

### Circuit Breakers

| Llamada | Config |
|---------|--------|
| `reservas → pagos` | 5 fallos → OPEN, 30s → HALF_OPEN, 2 éxitos → CLOSED |
| `pagos → ext-payments` | misma config |

---

## Alternativas evaluadas

| Alternativa | Rechazo |
|-------------|---------|
| Pago síncrono en misma request que reserva | Latencia UI depende del PSP; si PSP falla, reserva falla |
| Saga coreografiada completa | Complejidad alta para prototipo; la solución actual es un subconjunto suficiente |
| Outbox pattern completo | Complejidad adicional; no necesario para este volumen |

---

## Consecuencias

+ Reserva se crea sin esperar confirmación del PSP (latencia reducida)
+ Fallo del PSP no impide crear la reserva (circuit breaker retorna error controlado)
+ Idempotencia garantizada por guard en `pagos` (una reserva = un pago)
+ Pagos abandonados detectados automáticamente (scheduler 60s)
- Mayor complejidad operacional (estado eventual, múltiples componentes)
- Requiere monitoreo de ActiveMQ (consola web http://localhost:8161)
- El estado del pago puede ser `pendiente` por hasta 20 min antes de marcarse `abandonado`

---

## Validación

Ver colecciones Postman en `postman/Pagos_Resilience_Test_Flow.postman_collection.json` y `postman/Payment_Abandonment_Test.postman_collection.json`.