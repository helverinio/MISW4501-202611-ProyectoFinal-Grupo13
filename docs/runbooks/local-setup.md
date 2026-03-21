# Local Setup

> Guía completa: ver `docs/GUIA_INSTALACION_LOCAL.md`

## Requisitos

- **Docker Desktop** 4.0+ (incluye Docker Compose)
- Git

Opcional (solo si se desarrolla fuera de Docker): Python 3.11, Postman, JMeter

---

## Levantar el sistema completo

### Modo estándar (desarrollo)

```bash
docker-compose up --build
```

### Modo escalado (pruebas de carga — recomendado para validar ASRs)

```bash
docker-compose -f docker-compose-scaled.yml up --build
```

En modo escalado: 3 instancias de `gateway` + 3 de `reservas`, balanceadas por Nginx en puerto 8081.

---

## Servicios y puertos

| Servicio | Puerto host | URL |
|----------|-------------|-----|
| Gateway (punto de entrada) | 8081 | http://localhost:8081/api/v1/ |
| Reservas (directo) | 5000 | http://localhost:5000/api/v1/ |
| Pagos (directo) | 5002 | http://localhost:5002/api/v1/ |
| Ext-Payments (directo) | 5001 | http://localhost:5001/api/v1/ |
| ActiveMQ consola web | 8161 | http://localhost:8161/admin/ (admin/admin) |
| Redis | 6379 | — |
| reservas-db (PostgreSQL) | 5433 | — |
| pagos-db (PostgreSQL) | 5435 | — |
| ext-payments-db (PostgreSQL) | 5434 | — |

---

## Verificar que todo funciona

```bash
curl http://localhost:8081/health
curl http://localhost:5000/api/v1/health
curl http://localhost:5002/api/v1/health
curl http://localhost:5001/api/v1/health
```

Respuesta esperada: `{"status": "ok", "service": "<nombre>"}`

El endpoint de `reservas` también reporta estado de Redis:
```json
{"status": "ok", "service": "reservas", "redis": {"status": "ok"}}
```

---

## Pruebas con Postman

Importar `postman_collection.json` (colección principal) o las colecciones en `postman/`.
Variables preconfiguradas: `gateway_url=http://localhost:8081`, etc.

---

## Pruebas de carga (JMeter)

```bash
# Prueba de concurrencia en holds
jmeter -n -t tests/jmeter/concurrent_room_hold_test.jmx -l results.jtl

# Prueba de concurrencia en pagos
jmeter -n -t tests/jmeter/concurrent_payment_test.jmx -l results.jtl -e -o results/html-report
```

Resultados históricos en `tests/jmeter/results_*/`.

---

## Detener y limpiar

```bash
# Detener sin borrar datos
docker-compose down

# Detener y borrar todas las BDs (irreversible)
docker-compose down -v
```