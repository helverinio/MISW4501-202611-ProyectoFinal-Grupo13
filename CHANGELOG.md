# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

---

## [v1.0.0] – Entrega final – 2026-03-21

### Microservicios implementados

#### `reservas` (puerto 5000)
- CRUD completo: Países, Ciudades, Hoteles, Habitaciones, Tarifas, Estados, Reservas, Pagos (shadow), Notificaciones
- **Room Hold**: creación de hold temporal (15 min) con Redis distributed lock (`room_hold_lock:{id}:{in}:{out}`)
- Cache de holds en Redis (`room_hold_cache:...`) con TTL dinámico
- Liberación atómica de lock con script Lua (compare-and-delete)
- Validación de solapamiento de reservas al crear reserva confirmada
- Integración PMS via `POST /api/v1/reservas/webhook/pms`
- Subscriber ActiveMQ `/queue/PaymentStatusUpdated` con retry (3x) y DLQ
- Circuit breaker hacia `pagos` (5 fallos → OPEN, 30s → HALF_OPEN)
- Health check con estado de Redis en `/api/v1/health`
- gunicorn con 4 workers, 4 threads, worker-class gthread

#### `pagos` (puerto 5002)
- Registro de pagos con idempotencia por `reservation_id`
- Ciclo de vida: `pendiente` → `procesando` → `completado` / `abandonado`
- Optimistic lock en procesamiento: `UPDATE WHERE status='pendiente'`
- Circuit breaker hacia `ext-payments` (misma config que reservas)
- Publisher ActiveMQ `/topic/PaymentStatusUpdated`
- Subscriber ActiveMQ `/queue/PaymentStatusUpdated` con retry + DLQ
- **Payment abandonment scheduler**: background thread, cada 60s, marca pendientes >20 min
- Webhook receiver `POST /api/v1/payments/webhook` (deprecated, mantenido por compat)

#### `ext-payments` (puerto 5001)
- Simulación de PSP externo (Stripe/MercadoPago)
- Creación de PaymentIntents (`POST /api/v1/payment-intents`)
- Procesamiento de pagos (`POST /api/v1/payments`)
- Notificación webhook asíncrona via background thread (timeout=10s)

#### `gateway` (puerto 8081)
- Reverse proxy HTTP transparente hacia `reservas` (todos los recursos) y `pagos` (/payments)
- Punto de entrada del webhook de `ext-payments` → proxy a `reservas`
- Timeout downstream: 30s
- gunicorn con 4 workers, 4 threads, worker-class gthread

### Infraestructura
- PostgreSQL: 3 instancias separadas (reservas-db:5433, pagos-db:5435, ext-payments-db:5434)
- Redis: locking + cache (puerto 6379)
- ActiveMQ: STOMP (61613), OpenWire (61616), consola (8161)
- Nginx: balanceador de carga en modo escalado (3 instancias gateway + 3 reservas)
- `docker-compose.yml`: modo desarrollo
- `docker-compose-scaled.yml`: modo producción/pruebas de carga

### Pruebas
- Tests unitarios por microservicio (`tests/` en cada servicio)
- JMeter: `tests/jmeter/concurrent_room_hold_test.jmx` y `concurrent_payment_test.jmx`
- Resultados JMeter: `tests/jmeter/results_hold_*/` y `tests/jmeter/results_payments_*/`
- Colecciones Postman: `postman/Pagos_Resilience_Test_Flow.postman_collection.json`, `postman/Payment_Abandonment_Test.postman_collection.json`

### Documentación
- `.ai/`: contexto para GitHub Copilot (system-overview, domain-context, integration-points, known-constraints)
- `docs/architecture/`: bounded-contexts, data-flow-main-scenarios
- `docs/adr/`: ADR-001 (Redis lock), ADR-002 (async payments)
- `docs/integrations/`: apis-exposed, apis-consumed
- `docs/runbooks/`: local-setup, troubleshooting
- `docs/GUIA_INSTALACION_LOCAL.md`: guía completa de instalación