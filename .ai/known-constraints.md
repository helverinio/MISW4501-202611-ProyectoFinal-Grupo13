# Known Constraints

## Técnicas

- Arquitectura debe soportar 800 TPM (validado con JMeter en `tests/jmeter/`)
- Base de datos relacional: PostgreSQL (una instancia por microservicio)
- Redis para locks distribuidos: clave `room_hold_lock:{room_id}:{in}:{out}`, TTL=30s
- Mensajería asíncrona: ActiveMQ vía STOMP (puerto 61613), compatible con Amazon MQ
- Python 3.11 + Flask 3.0 + gunicorn (workers=4, threads=4, gthread)
- IDs de entidades: UUID como strings de 36 caracteres (no autoincrement)
- Todas las rutas públicas pasan por el gateway en `/api/v1/...`

---

## De entorno

- Pruebas realizadas en entorno local (Windows + Docker Desktop)
- En Windows, el pool de puertos efímeros es limitado (~16K puertos). Bajo carga alta (>500 req/s) pueden agotarse → usar `docker-compose-scaled.yml` con Nginx
- Redis y ActiveMQ deben estar disponibles antes de levantar `reservas` y `pagos`
- Los health checks de docker-compose usan `curl http://localhost:{port}/health`

---

## De negocio

- Sistema actual debe seguir operando (migración gradual)
- Presupuesto limitado (prototipo académico MISO)
- Equipo pequeño

---

## De arquitectura

- Pagos deben ser desacoplados: `reservas` llama a `pagos` vía HTTP + circuit breaker; `pagos` llama a `ext-payments` vía HTTP + circuit breaker
- No almacenar datos sensibles de tarjeta: solo se guarda el tipo de método de pago (`card`)
- Idempotencia en pagos: una reserva solo puede tener un pago (guard en `pagos`)
- No romper integración con PMS: webhook `POST /api/v1/reservas/webhook/pms` debe seguir funcionando

---

## Restricciones de configuración actuales

| Variable | Valor docker-compose | Notas |
|----------|----------------------|-------|
| `REDIS_LOCK_TIMEOUT_SECONDS` | 30 | No bajar de 10s en producción |
| `MQ_MAX_RETRIES` | 3 | Mensajes fallidos van a DLQ tras este límite |
| `ABANDONMENT_STALE_MINUTES` | 20 | Pagos pendientes ≥ 20 min se marcan abandonados |
| `ABANDONMENT_CHECK_INTERVAL` | 60 | Segundos entre ejecuciones del scheduler |
| Gateway timeout downstream | 30s | `requests` timeout en `_request()` del gateway |

---

## Lo que NO está implementado (límites del prototipo)

- Autenticación / autorización (no hay JWT ni RBAC)
- Búsqueda / ranking de hospedaje (no hay endpoint de search)
- Gestión de usuarios (usuario es solo un `id_usuario` UUID)
- Múltiples monedas reales (solo se acepta el campo `currency`, sin conversión)
- Notificaciones push / email (solo registro en tabla `notificaciones`)
- TLS / HTTPS en desarrollo local