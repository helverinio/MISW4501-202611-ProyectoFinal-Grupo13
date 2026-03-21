# APIs Consumed

## Llamadas inter-servicio reales (según código)

---

### `reservas` → `pagos`

**Protegido por**: Circuit Breaker (`pagos-service`: 5 fallos → OPEN, 30s → HALF_OPEN)
**Variable de entorno**: `PAGOS_SERVICE_URL=http://pagos:5002`

| Operación | Método | URL | Body |
|-----------|--------|-----|------|
| Registrar pago al crear reserva | `POST` | `{PAGOS_SERVICE_URL}/api/v1/payments` | `{reservation_id, amount, currency, payment_method, description}` |

---

### `pagos` → `ext-payments`

**Protegido por**: Circuit Breaker (`ext-payments-service`: misma config)
**Variable de entorno**: `EXT_PAYMENTS_URL=http://ext-payments:5001`

| Operación | Método | URL | Body |
|-----------|--------|-----|------|
| Crear PaymentIntent | `POST` | `{EXT_PAYMENTS_URL}/api/v1/payment-intents` | `{amount, currency, description, webhook_url, reservation_id}` |
| Ejecutar pago | `POST` | `{EXT_PAYMENTS_URL}/api/v1/payments` | `{payment_intent_id, payment_method}` |
| Consultar pago | `GET` | `{EXT_PAYMENTS_URL}/api/v1/payments/{id}` | — |

El `webhook_url` que se registra en ext-payments es:
`{PAGOS_WEBHOOK_URL}/api/v1/payments/webhook`
donde `PAGOS_WEBHOOK_URL=http://gateway:8080` (docker-compose)

---

### `ext-payments` → webhook (gateway → reservas)

**Llamada asíncrona**: background thread, timeout=10s, errores silenciosos

| Trigger | Método | URL destino | Body |
|---------|--------|-------------|------|
| Pago completado | `POST` | `{webhook_url}` registrado en PaymentIntent | `{payment_intent_id, status: 'completado', reservation_id, amount, currency}` |

La ruta completa: `ext-payments` → `gateway:8080/api/v1/payments/webhook` → `reservas:5000/api/v1/payments/webhook`

---

### `gateway` → `reservas` y `pagos` (proxy)

**Timeout**: 30 segundos por request
**Variables**: `RESERVAS_SERVICE_URL=http://reservas:5000`, `PAGOS_SERVICE_URL=http://pagos:5002`

El gateway hace proxy transparente de todas las rutas (ver `docs/integrations/apis-exposed.md`).

---

## Sistemas externos NO implementados aún

| Sistema | Propósito | Estado |
|---------|-----------|--------|
| Stripe / MercadoPago (PSP real) | Procesador de pagos real | Simulado por `ext-payments` |
| PMS externo (hotel) | Sincronización de inventario | Solo entrada webhook `POST /reservas/webhook/pms` |
| Email / SMS provider | Notificaciones al usuario | No implementado |
| Amazon MQ | ActiveMQ en nube | Compatible (mismo protocolo STOMP) |