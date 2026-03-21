# Domain Context – TravelHub

## Entidades principales implementadas

### Servicio `reservas` (PostgreSQL `reservas`)

| Entidad | Tabla | Campos principales |
|---------|-------|--------------------|
| País | `paises` | `id` (UUID), `nombre` |
| Ciudad | `ciudades` | `id`, `nombre`, `id_pais` → FK paises |
| Hotel | `hoteles` | `id`, `nombre`, `email`, `descripcion`, `amenidades` (Text), `id_ciudad` → FK ciudades |
| Habitación | `habitaciones` | `id`, `tipo`, `nro_habitacion` (int), `capacidad` (int), `camas` (int), `id_hotel` → FK hoteles |
| Tarifa | `tarifas` | `id`, `nombre`, `valor` (float), `descuento` (float, default 0.0), `id_habitacion` → FK habitaciones |
| Estado | `estados` | `id`, `nombre`, `descripcion` |
| Reserva | `reservas` | `id`, `fecha_ingreso` (DateTime), `fecha_salida` (DateTime), `total` (float), `nro_personas` (int), `id_usuario` (UUID str), `id_pais`, `id_habitacion`, `id_estado` |
| Pago (shadow) | `pagos` | `id`, `fecha_pago`, `total`, `estado` (str 50), `id_pais`, `id_reserva` |
| Notificación | `notificaciones` | `id`, `fecha_notif`, `titulo`, `descripcion`, `id_reserva` |
| Room Hold | `room_holds` | `id`, `id_habitacion`, `id_usuario`, `fecha_ingreso`, `fecha_salida`, `created_at`, `expires_at` |

### Servicio `pagos` (PostgreSQL `pagos`)

| Entidad | Tabla | Campos |
|---------|-------|--------|
| Payment | `payments` | `id`, `external_payment_id`, `payment_intent_id`, `reservation_id`, `amount` (float), `currency` (str 3), `status` (str 20), `payment_method` (str 50), `created_at`, `updated_at` |

**Estados de Payment:** `pendiente` → `procesando` → `completado` / `abandonado`

### Servicio `ext-payments` (PostgreSQL `ext_payments`)

| Entidad | Tabla | Campos |
|---------|-------|--------|
| PaymentIntent | `payment_intents` | `id`, `amount`, `currency`, `description`, `status`, `webhook_url`, `reservation_id`, `created_at` |
| Payment | `payments` | `id`, `payment_intent_id`, `amount`, `currency`, `status` (default `completed`), `payment_method`, `created_at`, `updated_at` |

---

## Conceptos clave

### Hold (Reserva provisional)
Bloqueo temporal de una habitación antes del pago. Implementado como registro en tabla `room_holds` con `expires_at = now + 15 minutos` (configurable). El hold se cachea en Redis con TTL = duración del hold. Solo puede existir un hold activo por habitación + rango de fechas.

### Overbooking
El sistema lo previene con dos mecanismos complementarios:
1. Redis distributed lock: `room_hold_lock:{room_id}:{fecha_ingreso}:{fecha_salida}` (TTL=30s)
2. Validación DB de reservas solapadas al crear reserva

### PMS (Property Management System)
Sistema externo del hotel. Se integra vía `POST /api/v1/reservas/webhook/pms`. Cuando llega este webhook, el sistema crea automáticamente una reserva con estado `Reservada via PMS` (crea el estado si no existe).

### PSP (Payment Service Provider)
Simulado localmente por el microservicio `ext-payments`. En producción sería Stripe, MercadoPago, etc. El flujo usa PaymentIntents: primero se crea un intent, luego se ejecuta el pago.

---

## Reglas de negocio implementadas

| Regla | Implementación |
|-------|----------------|
| Solo 1 hold activo por habitación+fechas | Redis lock + unicidad en DB |
| Hold dura 15 minutos | `expires_at = now + hold_duration_minutes` (default 15) |
| No overbooking | Validación de reservas solapadas al crear reserva (bajo Redis lock) |
| Un pago por reserva | Guard de idempotencia en `pagos`: error si ya existe pago con mismo `reservation_id` |
| Pago es asíncrono | Se registra como `pendiente`, se procesa con `POST /payments/{id}/process` |
| Pagos abandonados | Scheduler en `pagos` marca como `abandonado` payments con status=`pendiente` y `created_at < now - 20 min` |
| No se almacenan tarjetas | Solo se guarda `payment_method` (tipo, e.g. `card`), nunca números sensibles |
| Circuit breaker en llamadas internas | `reservas→pagos` y `pagos→ext-payments`: 5 fallas consecutivas abren el circuito |

---

## Problemas del negocio que resuelve

| Problema original | Solución implementada |
|-------------------|----------------------|
| Overbooking | Redis lock + validación DB solapamiento |
| Alta latencia en pagos | Pagos asíncronos desacoplados |
| Acoplamiento entre módulos | Microservicios + ActiveMQ |
| Inconsistencia de inventario | Hold temporal + lock distribuido |
| Pérdida de reservas por fallo en pago | Circuit breaker con fallback controlado |
| Pagos abandonados sin liberar inventario | Scheduler de abandono cada 60 segundos |

---

## Límites del dominio

- Pagos reales: manejados por PSP externo (simulado en `ext-payments`)
- Inventario del hotel: manejado por PMS externo (webhook de entrada)
- Autenticación/autorización: no implementada en este prototipo (`id_usuario` es un UUID arbitrario)