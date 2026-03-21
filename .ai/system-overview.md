# System Overview – TravelHub

## ¿Qué resuelve este sistema?

TravelHub es una plataforma de reservas de hospedaje que conecta hoteles, agencias y viajeros en Latinoamérica (~1200 propiedades, ~350 agencias, ~450,000 usuarios activos). Procesa ~18,000 reservas mensuales con picos de hasta 800 TPM.

Permite:
- Gestión de catálogo (países, ciudades, hoteles, habitaciones, tarifas)
- Reserva con hold temporal (15 minutos)
- Pago desacoplado y asíncrono
- Sincronización de inventario vía webhook PMS

---

## Dominio

Travel / Hospitality / Booking Platform

---

## Límites del sistema

Este sistema NO es:
- Un PMS hotelero
- Un PSP (procesador de pagos)
- Un sistema contable

---

## Stack tecnológico real implementado

| Capa | Tecnología |
|------|------------|
| Lenguaje | Python 3.11 |
| Framework web | Flask 3.0 |
| ORM | SQLAlchemy 2.0.23 + Flask-SQLAlchemy 3.1.1 |
| Migraciones | Flask-Migrate 4.0.4 |
| Servidor WSGI | gunicorn (workers=4, threads=4, worker-class=gthread) |
| Base de datos | PostgreSQL (una por microservicio) |
| Cache / Locking | Redis 4.6.0 |
| Message Broker | ActiveMQ (protocolo STOMP vía stomp.py 8.1.0) |
| Balanceador | Nginx (modo escalado) |
| Contenedores | Docker + Docker Compose |

---

## Microservicios implementados

| Servicio | Puerto host | Puerto interno | BD | Descripción |
|----------|-------------|----------------|----|-------------|
| `gateway` | 8081 | 8080 | — | Reverse proxy, punto de entrada público |
| `reservas` | 5000 | 5000 | PostgreSQL `reservas` (5433→5432) | Catálogo + holds + reservas + pagos shadow |
| `pagos` | 5002 | 5002 | PostgreSQL `pagos` (5435→5432) | Orquestación interna de pagos |
| `ext-payments` | 5001 | 5001 | PostgreSQL `ext_payments` (5434→5432) | Simulador de PSP externo |
| `activemq` | 61616/61613/8161 | — | — | Message broker |
| `redis` | 6379 | 6379 | — | Lock distribuido + cache de holds |

---

## Sistemas externos simulados en este repo

- **PSP (ext-payments)**: simulación de Stripe/MercadoPago implementada localmente
- **PMS**: integrable vía `POST /api/v1/reservas/webhook/pms`
- **ActiveMQ**: compatible con Amazon MQ en producción
- **Redis**: lock distribuido + cache

---

## Flujo principal implementado

```
Cliente → Gateway (:8081)
  └→ POST /api/v1/habitaciones/{id}/hold  → reservas:5000
       [Redis lock + DB write + Redis cache]
  └→ POST /api/v1/reservas               → reservas:5000
       [Redis lock + validar hold + crear reserva]
       └→ POST /api/v1/payments           → pagos:5002
            [idempotencia + circuit breaker]
            └→ POST /api/v1/payment-intents → ext-payments:5001
  └→ POST /api/v1/payments/{id}/process  → pagos:5002
       └→ POST /api/v1/payments           → ext-payments:5001
            └→ [background thread] POST /api/v1/payments/webhook → gateway → reservas
```

---

## Patrones de resiliencia implementados

| Patrón | Servicio | Configuración real |
|--------|----------|--------------------|
| Redis Distributed Lock | `reservas` | TTL=30s, retry=1×50ms, liberación atómica Lua |
| Redis Cache (holds) | `reservas` | TTL = duración del hold (15 min por defecto) |
| Circuit Breaker | `reservas→pagos`, `pagos→ext-payments` | 5 fallas→OPEN, 30s→HALF_OPEN, 2 éxitos→CLOSED |
| Idempotency Guard | `pagos` | Una sola reserva por `reservation_id` |
| Optimistic Lock | `pagos` | `UPDATE WHERE status='pendiente'` atómico |
| Message Retry + DLQ | `reservas` y `pagos` | 3 reintentos, luego → `/topic/PaymentStatusUpdated.DLQ` |
| Payment Abandonment | `pagos` | Scheduler cada 60s, marca pendientes >20 min como `abandonado` |
| Async Webhook | `ext-payments` | Background thread, timeout=10s |

---

## Objetivos de calidad (ASRs)

| Operación | Objetivo | Validado con |
|-----------|----------|---------------|
| Crear hold | ≤ 1.5s | JMeter concurrent_room_hold_test.jmx |
| Crear reserva | ≤ 1.5s | JMeter concurrent_payment_test.jmx |
| Disponibilidad (hold check) | ≤ 200ms | — |
| 0% overbooking | 0 reservas duplicadas | Tests concurrencia |
| Escalar a 800 TPM | Sin degradación | JMeter (resultados en tests/jmeter/) |

---

## Riesgos principales

- Concurrencia sobre inventario → mitigado con Redis lock
- Idempotencia en pagos → mitigado con guard por `reservation_id`
- Latencia bajo carga → validada con JMeter (resultados en `tests/jmeter/`)