# ADR-001 – Control de concurrencia con Redis

## Estado: Aceptado

## Contexto

El microservicio `reservas` recibe peticiones concurrentes de hold y creación de reservas sobre las mismas habitaciones y fechas. Sin sincronización, múltiples usuarios pueden reservar la misma habitación simultáneamente (overbooking). La solución debe ser:
- Distribuida (múltiples instancias del servicio en modo escalado)
- Rápida (no bloquear la BD)
- Con fast-fail para peticiones concurrentes

---

## Decisión

Usar Redis como lock distribuido mediante el patrón SET NX EX (similar a Redlock para instancia única).

**Implementación real** (microservicio `reservas`):

### Claves usadas

| Clave | Propósito |
|-------|-----------|
| `room_hold_lock:{room_id}:{fecha_ingreso}:{fecha_salida}` | Mutex para hold + creación de reserva |
| `room_hold_cache:{room_id}:{fecha_ingreso}:{fecha_salida}` | Cache JSON del hold activo |
| `room_hold_id:{hold_id}` | Puntero de hold_id → clave de cache |

### Configuración (variables de entorno)

| Variable | Valor docker-compose | Descripción |
|----------|----------------------|-------------|
| `REDIS_LOCK_TIMEOUT_SECONDS` | `30` | TTL del lock (libera automáticamente si el proceso muere) |
| `REDIS_LOCK_RETRY_TIMES` | `1` | Reintentos de adquisición |
| `REDIS_LOCK_RETRY_DELAY_MS` | `50` | Pausa entre reintentos |

### Mecanismo de liberación

La liberación del lock usa un script Lua atómico (compare-and-delete) para evitar que un proceso libere el lock de otro:
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
	return redis.call("del", KEYS[1])
else
	return 0
end
```

### Comportamiento por operación

- **`POST /habitaciones/{id}/hold`**: adquisición no-blocking (fast-fail) → 429 si lock ocupado
- **`POST /reservas`**: adquisición blocking (hasta ~10s) → garantiza atomicidad de validación + escritura

### Fallback

Si Redis no está disponible, el sistema cae a modo DB-only (atomicidad por constraints de BD). El health check de `/api/v1/health` reporta `redis: {status: error}`.

---

## Alternativas evaluadas

| Alternativa | Rechazo |
|-------------|---------|
| Lock en BD (SELECT FOR UPDATE) | Satura conexiones bajo alta concurrencia |
| Lock en memoria de aplicación | No funciona con múltiples instancias (modo escalado) |
| Redlock multi-nodo | Complejidad sin beneficio para este prototipo (1 nodo Redis) |

---

## Consecuencias

+ Evita overbooking bajo alta concurrencia (validado con JMeter 800 TPM)
+ Fast-fail: peticiones rechazadas inmediatamente (429) sin bloquear la BD
+ Compatible con escalado horizontal (múltiples instancias gateway + reservas con Nginx)
- Dependencia de Redis: si falla, se degrada a modo DB-only
- TTL mal ajustado puede generar locks fantasma (mitigado con 30s y Lua release)

---

## Validación

Ver resultados JMeter en `tests/jmeter/results_hold_*/` y `tests/jmeter/results_payments_*/`.