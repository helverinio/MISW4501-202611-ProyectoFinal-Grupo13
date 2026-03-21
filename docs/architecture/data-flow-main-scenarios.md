# Main Data Flows
 – TravelHub

## 1. Crear Hold de Habitación

**Trigger**: Usuario selecciona habitación y fechas

```
POST /api/v1/habitaciones/{id}/hold
Body: {id_usuario, fecha_ingreso, fecha_salida, hold_duration_minutes?}
```

Flujo interno en `reservas`:
1. Busca hold activo en Redis cache (`room_hold_cache:{id}:{in}:{out}`) — fast path
2. Intenta adquirir Redis lock `room_hold_lock:{id}:{in}:{out}` (no-blocking, fast-fail)
3. Si lock falla → **429 Too Many Requests** (otra petición en progreso)
4. Si lock ok → verifica en DB si ya existe hold activo para esas fechas
5. Si ya existe → **409 Conflict**
6. Si no existe → crea registro en `room_holds` con `expires_at = now + 15 min`
7. Guarda en Redis cache con TTL = duración del hold
8. Libera lock
9. Retorna **201** `{id, id_habitacion, id_usuario, fecha_ingreso, fecha_salida, created_at, expires_at}`

**Resultado**: exactamente 1 hold activo por habitación+fechas, N rechazos concurrentes.

---

## 2. Crear Reserva Confirmada

**Trigger**: Usuario confirma reserva (tiene hold activo)

```
POST /api/v1/reservas
Body: {fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais,
		 id_habitacion, id_estado, payment_method?}
```

Flujo interno en `reservas`:
1. Adquiere Redis lock `room_hold_lock:{id}:{in}:{out}` (blocking, hasta 10s)
2. Valida que existe hold activo en DB para ese usuario/habitación/fechas
3. Verifica que no existan reservas confirmadas solapadas en DB
4. Crea registro en `reservas`
5. Elimina el hold de DB y del cache Redis
6. Libera lock
7. Llama `POST /api/v1/payments` en `pagos:5002` vía **circuit breaker** — si falla, reserva ya quedó creada
8. Retorna **201** `{id, ..., payment: {payment_id, payment_intent_id, payment_status}}`

---

## 3. Procesar Pago

**Trigger**: Backend (o cliente) inicia el procesamiento

```
POST /api/v1/payments/{id}/process   (directo a pagos:5002)
```

Flujo en `pagos`:
1. `try_lock_for_processing`: `UPDATE payments SET status='procesando' WHERE id=? AND status='pendiente'`
2. Si 0 filas afectadas → ya procesado o no existe → error
3. Llama `POST /api/v1/payments` en `ext-payments:5001` con `{payment_intent_id, payment_method}` vía **circuit breaker**
4. `ext-payments` crea pago con status `completed`
5. `ext-payments` actualiza PaymentIntent a `completed`
6. `ext-payments` lanza **background thread** que notifica:
	```
	POST {webhook_url}/api/v1/payments/webhook
	Body: {payment_intent_id, status: 'completado', reservation_id, amount, currency}
	```
7. El webhook llega al `gateway:8080/api/v1/payments/webhook` → proxy a `reservas:5000/api/v1/payments/webhook`
8. `reservas` `UpdatePaymentStatusUseCase` actualiza el pago shadow por `payment_intent_id`

**Características**: Asíncrono, idempotente (guard por `reservation_id`), circuit breaker

---

## 4. Detección de Pago Abandonado

**Trigger**: Scheduler background en `pagos` (cada 60 segundos)

Flujo:
1. Query: `SELECT * FROM payments WHERE status='pendiente' AND created_at < now - 20 min`
2. Para cada pago encontrado: `UPDATE status = 'abandonado'`
3. Publica evento `PaymentStatusUpdated` a ActiveMQ `/topic/PaymentStatusUpdated`

---

## 5. Integración PMS (entrada)

**Trigger**: Sistema externo del hotel notifica una reserva

```
POST /api/v1/reservas/webhook/pms
Body: {fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion}
```

Flujo en `reservas`:
1. Busca estado `Reservada via PMS`; si no existe, lo crea automáticamente
2. Crea reserva directamente (sin hold, sin pago)
3. Retorna **201**

---

## 6. Actualización de Estado vía ActiveMQ

**Publisher**: `pagos` publica a `/topic/PaymentStatusUpdated`
**Subscriber**: `reservas` consume `/queue/PaymentStatusUpdated`

Flujo en `reservas` al recibir mensaje:
1. Parsea `PaymentStatusUpdatedEvent`
2. Busca pago en DB por `payment_intent_id`
3. Actualiza estado del pago shadow
4. Si falla: incrementa `x-retry-count` y republica a misma queue
5. Tras 3 reintentos → envía a `/topic/PaymentStatusUpdated.DLQ`

---

## Diagrama simplificado (Hold + Reserva + Pago)

```
Cliente       Gateway:8081    Reservas:5000    Pagos:5002   ExtPayments:5001
	|               |                |               |               |
	|--POST /hold-->|---POST /hold-->|               |               |
	|               |  [lock+DB]    |               |               |
	|<--201 hold----|<--201 hold----|               |               |
	|               |               |               |               |
	|--POST /res--->|--POST /res--->|               |               |
	|               | [lock+hold]   |               |               |
	|               | [crear res]   |--POST /pay--->|               |
	|               |               |               |--POST /intent->
	|               |               |               |<---201--------|
	|               |               |<---201 pago---|               |
	|<--201 res-----|<--201 res-----|               |               |
	|               |               |               |               |
	|--POST /process|               |               |               |
	|   (→ pagos)-->|--POST /proc-->|               |               |
	|               |               |           --->|--POST /pay--->|
	|               |               |               |<---201--------|
	|               |               |               |  [bg webhook] |
	|               |<--webhook-----|<--webhook-----|--POST webhook-|
	|               |               | [update pago] |               |
```