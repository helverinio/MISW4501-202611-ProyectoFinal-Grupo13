# Integration Points

## Redis
- **Propósito**: Lock distribuido + cache de holds
- **Host/Puerto**: `redis:6379` (docker) | `REDIS_HOST:REDIS_PORT`
- **Impacto**: Crítico (sin Redis el sistema cae a modo DB-only para locks)
- **Patrones de clave usados**:

| Clave | Tipo | TTL | Uso |
|-------|------|-----|-----|
| `room_hold_lock:{room_id}:{fecha_ingreso}:{fecha_salida}` | STRING (SET NX EX) | `REDIS_LOCK_TIMEOUT_SECONDS` (default 30s) | Mutex distribuido para operaciones de hold/reserva |
| `room_hold_cache:{room_id}:{fecha_ingreso}:{fecha_salida}` | STRING (JSON) | Expiry del hold (~900s para hold de 15 min) | Cache del hold activo |
| `room_hold_id:{hold_id}` | STRING (puntero) | Igual que cache entry | Lookup de hold por ID |

- Lock usa script Lua atómico para liberar (compare-and-delete)
- Variables: `REDIS_LOCK_TIMEOUT_SECONDS=30`, `REDIS_LOCK_RETRY_TIMES=1`, `REDIS_LOCK_RETRY_DELAY_MS=50`

---

## ActiveMQ (Message Broker)
- **Protocolo**: STOMP (puerto 61613)
- **OpenWire**: 61616 | **Consola Web**: http://localhost:8161 (admin/admin)
- **Propósito**: Comunicación asíncrona entre servicios para estados de pago
- **Impacto**: Alto (pagos asíncronos)
- **Variables**: `MQ_HOST=activemq`, `MQ_PORT=61613`, `MQ_USERNAME=admin`, `MQ_PASSWORD=admin`

### Destinos (Destinations)

| Dirección | Destino | Servicio | Formato |
|-----------|---------|----------|---------|
| Publisher | `/topic/PaymentStatusUpdated` | `pagos` | `PaymentStatusUpdatedEvent` JSON |
| Subscriber | `/queue/PaymentStatusUpdated` | `reservas` | `PaymentStatusUpdatedEvent` JSON |
| Subscriber | `/queue/PaymentStatusUpdated` | `pagos` | `PaymentStatusUpdatedEvent` JSON |
| DLQ | `/topic/PaymentStatusUpdated.DLQ` | `reservas` y `pagos` | `{original_message, error, retry_count, max_retries, failed_at, source_topic}` |

### `PaymentStatusUpdatedEvent` (campos reales)

```json
{
  "payment_id": "<uuid>",
  "payment_intent_id": "<uuid>",
  "reservation_id": "<uuid>",
  "status": "completado | abandonado | ...",
  "amount": 100.0,
  "currency": "USD",
  "updated_at": "2024-01-01T00:00:00"
}
```

- Retry: hasta `MQ_MAX_RETRIES=3` vía header `x-retry-count`; luego DLQ
- ACK Mode: manual

---

## PMS (Property Management System) — Integración de entrada

- **Propósito**: Recibir reservas creadas en sistemas externos del hotel
- **Endpoint**: `POST /api/v1/reservas/webhook/pms` (en `reservas` vía `gateway`)
- **Body**: `{fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion}`
- **Comportamiento**: Crea reserva con estado `Reservada via PMS` (auto-crea el estado si no existe)
- **Impacto**: Bajo (no bloqueo, crea directamente sin hold)

---

## PSP (Payment Service Provider) — Microservicio `ext-payments`

- **Propósito**: Simulación de procesador de pagos externo (Stripe / MercadoPago)
- **Host**: `ext-payments:5001`
- **Llamado por**: `pagos` (a través de circuit breaker)
- **Variable**: `EXT_PAYMENTS_URL=http://ext-payments:5001`

| Operación | Endpoint | Body | Respuesta |
|-----------|----------|------|-----------|
| Crear PaymentIntent | `POST /api/v1/payment-intents` | `{amount, currency, description, webhook_url, reservation_id}` | `{id, status: pending, webhook_url, ...}` |
| Ejecutar pago | `POST /api/v1/payments` | `{payment_intent_id, payment_method}` | `{id, status: completed, ...}` |
| Consultar pago | `GET /api/v1/payments/<id>` | — | payment object |

- Webhook: al completar el pago, `ext-payments` hace `POST {webhook_url}` en background thread con `{payment_intent_id, status: 'completado', reservation_id, amount, currency}`
- El `webhook_url` registrado es: `{PAGOS_WEBHOOK_URL}/api/v1/payments/webhook` → llega al gateway → `reservas`

---

## Circuit Breaker (inter-servicio)

| Protección | Servicio | Configuración |
|------------|----------|---------------|
| `reservas → pagos` | `pagos-service` | 5 fallos → OPEN, 30s → HALF_OPEN, 2 éxitos → CLOSED |
| `pagos → ext-payments` | `ext-payments-service` | Misma config |

Cuando el circuito está abierto, `reservas` retorna `{error: 'Payment service temporarily unavailable...', circuit_open: true}` sin fallar la reserva.