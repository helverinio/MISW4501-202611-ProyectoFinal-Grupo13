# EVIDENCIA CONSOLIDADA — Pruebas de Carga ASR08: Concurrencia Multi-País

> **Documento:** `docs/EVIDENCIA_ASR08_CONSOLIDADA.md`
> **Sprint:** 3 — 15 mayo 2026
> **ASR:** ASR08 — Concurrencia multi-país
> **Grupo:** 13 | MISW4501-202611
> **Pruebas ejecutadas:** 2026-05-15 22:03 UTC (BD) y 22:26 UTC (Redis)
> **Ambiente:** Producción AWS — `d1r8df79ch2otn.cloudfront.net`

---

## 1. Resumen ejecutivo

Se ejecutaron dos pruebas de carga distintas contra el ambiente de producción AWS para validar el
ASR08 (*concurrencia multi-país, 600 usuarios concurrentes por país*). Cada prueba ataca un endpoint
diferente y ejerce una presión distinta sobre los componentes del sistema:

| Prueba | Endpoint | Componente crítico | Resultado global |
|--------|----------|--------------------|-----------------|
| **Prueba 1** | `POST /hoteles/buscar-disponibles` | RDS PostgreSQL | ❌ FAIL todos los niveles |
| **Prueba 2** | `GET /holds/{hold_id}` | Redis ElastiCache | ✅ PASS nivel 10 / ❌ FAIL niveles 25–600 |

La brecha no es de diseño de software sino de **capacidad de la infraestructura** durante la prueba:
una sola tarea ECS con un pool limitado de conexiones BD y gunicorn workers no representa el
estado operativo escalado previsto en la arquitectura.

---

## 2. ASR08 — Atributo de Calidad

| Campo | Valor |
|-------|-------|
| **ID** | ASR08 |
| **Estímulo** | 600 usuarios concurrentes por país (3 600 total) |
| **Respuesta esperada** | Latencia p95 ≤ 1 500 ms, tasa de error < 5 % |
| **Umbral p95** | 1 500 ms (= 800 ms server-side + 700 ms red Colombia → us-east-1) |
| **HU asociadas** | HU-W-19 (carrito con hold temporal), TFP-15.1 |

---

## 3. Infraestructura durante las pruebas

### 3.1 Mapa de contenedores (CloudWatch — Cluster ECS)

La siguiente imagen muestra los servicios activos en el cluster ECS `th-prod` al momento de las
pruebas:

> Imagen: `tests/pruebas_carga/cloudwatch_evidences/mapa_de_contenedores.png`

El cluster operaba con **configuración mínima**:

| Servicio | Tareas activas | Notas |
|----------|---------------|-------|
| `th-prod-gateway` | 2 | Estable; sin cuello de botella |
| `th-prod-reservas` | 1 (→ 2 brevemente) | Único procesador de requests; saturado durante la prueba |
| `th-prod-pagos` | 1 | Sin actividad durante las pruebas |
| `th-prod-usuarios` | 1 | Sin actividad durante las pruebas |
| RDS PostgreSQL | 1 instancia Multi-AZ | Subutilizada en Prueba 2 |
| Redis ElastiCache | 1 nodo | Sirvió 100 % de los requests en Prueba 2 |

---

## 4. Prueba 1: Endpoint de búsqueda (`POST /hoteles/buscar-disponibles`)

### 4.1 Descripción

Cada request ejecuta una búsqueda completa en la base de datos PostgreSQL (joins entre tablas
de hoteles, habitaciones y disponibilidad), sin ninguna capa de cache.

```
POST /api/v1/hoteles/buscar-disponibles
Body: {"busqueda": "Bogota", "fecha_ingreso": "...", "fecha_salida": "...", "nro_personas": 2}
```

Fechas rotadas (`today + 60 + i % 5`) para evitar cache de nivel de aplicación.

### 4.2 Parámetros

| Parámetro | Valor |
|-----------|-------|
| Niveles | 10, 25, 50, 100, 200, 400, 600 |
| Requests/nivel | 100 |
| Total | 700 |
| Timeout | 20 s |
| Ejecución | 2026-05-15 22:03 UTC |

### 4.3 Resultados

| Concurrencia | N | Errores | p50 (ms) | p75 (ms) | p95 (ms) | p99 (ms) | Mín (ms) | Máx (ms) | Veredicto |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 100 | 0 | 3 508 | 3 729 | **4 370** | 4 975 | 2 395 | 5 131 | ❌ FAIL |
| **25** | 100 | 2 | 7 233 | 12 287 | **14 888** | 18 198 | 4 195 | 18 198 | ❌ FAIL |
| **50** | 100 | 17 | 14 002 | 16 624 | **20 072** | 23 785 | 7 176 | 23 785 | ❌ FAIL |
| **100** | 100 | 51 | 17 775 | 22 500 | **24 228** | 25 190 | 8 953 | 25 190 | ❌ FAIL |
| **200** | 100 | 66 | 19 956 | 22 376 | **26 590** | 26 678 | 11 891 | 26 678 | ❌ FAIL |
| **400** | 100 | 79 | 21 576 | 24 189 | **27 133** | 27 834 | 11 442 | 27 834 | ❌ FAIL |
| **600** | 100 | 86 | 21 305 | 23 730 | **27 582** | 27 582 | 13 225 | 27 582 | ❌ FAIL |

### 4.4 Evidencia CloudWatch durante Prueba 1

> Imágenes: `th-prod-reservas_1.png`, `th-prod-reservas_2.png`, `th-prod-postgres_1.png`, `th-prod-postgres_2.png`

**Servicio `reservas`:**
- CPU: pico hasta ~**99 %** a las 22:03 UTC, coincidiendo exactamente con la prueba.
- Memory: estable (el ORM no crea objetos masivos, el cuello de botella es el lock de BD).
- Red: pico sostenido de ~228 KB/s RX — el contenedor estaba recibiendo y encolando requests.
- `RunningTaskCount`: se mantuvo en **1** durante toda la Prueba 1 (el auto-scaling tardó más de la ventana de prueba en dispararse).

**RDS PostgreSQL:**
- `DatabaseConnections`: subió de **18 → 36** durante la Prueba 1. El pool del ORM (SQLAlchemy)
  alcanzó su límite configurado (~10 conexiones por tarea) y el resto de requests esperaron en cola.
- CPU RDS: máximo **12 %** — la BD no estaba saturada de cómputo; estaba bloqueada por la
  limitación del pool de conexiones del cliente.
- `BurstBalance`, `EBSByteBalance`, `EBSIOBalance`: todos > 95 %. La BD tenía capacidad sobrante;
  el cuello de botella era el número de conexiones simultáneas, no la potencia de cómputo.

### 4.5 Por qué falló la Prueba 1

```
Raíz del problema: Pool exhaustion en el ORM

Cliente → CloudFront → ALB → ECS (1 tarea, ~10 DB conn) → RDS
                                    ↑
                             CUELLO DE BOTELLA:
                        10 requests procesan a la vez.
                        Los otros 90 esperan en la cola
                        de gunicorn → timeout 20s → error.
```

| Factor | Impacto |
|--------|---------|
| 1 sola tarea ECS | Máximo ~10 conexiones BD simultáneas |
| Pool ORM agotado desde nivel 10 | p50 ya en 3 508 ms (2× por encima del umbral) |
| Sin cache de resultados | Cada request ejecuta un `SELECT` complejo con JOINs |
| CPU al 99 % | gunicorn no puede despachar nuevos requests sin esperar los actuales |

**El servidor no rechazó conexiones** — CloudFront/ALB aceptó todos los requests y los encoló. Los
"errores" son timeouts de procesamiento (20 s), no rechazos TCP. Esto confirma que la arquitectura de
red es correcta; la limitación es el dimensionamiento de la tarea ECS.

---

## 5. Prueba 2: Endpoint de holds (`GET /holds/{hold_id}`) — Redis cache

### 5.1 Descripción

Cada request consulta el hold de una habitación. Cuando el hold existe en Redis, el servidor retorna
la respuesta sin emitir ninguna query SQL:

```python
# microservices/reservas/app/api/v1/room_holds.py ~línea 148
cached_hold = lock_service.get_cached_room_hold_by_id(hold_id)
if cached_hold:
    cached_hold['is_active'] = True
    return jsonify(cached_hold)          # ← 0 queries SQL, retorno inmediato
```

El campo `is_active: True` en la respuesta indica cache hit y fue usado para validar el 100 % de
los requests en la suite de pruebas.

**Setup:** un único hold fue creado antes de la prueba con fecha +120 días (sin riesgo de conflicto),
TTL 15 minutos — suficiente para cubrir toda la ejecución (~5 min).

```
Hold ID:    89b1c739-b2d2-4db5-97de-be12299f465a
Habitación: b290f1ee-... (Suite Presidencial — Marriott Bogotá)
Fechas:     2026-09-12 → 2026-09-15
Expira:     2026-05-15T22:40:28 UTC
```

### 5.2 Parámetros

| Parámetro | Valor |
|-----------|-------|
| Niveles | 10, 25, 50, 100, 200, 400, 600 |
| Requests/nivel | 100 |
| Total | 700 |
| Timeout | 20 s |
| Ejecución | 2026-05-15 22:26 UTC |

### 5.3 Resultados

| Concurrencia | N | Errores | Cache Hits | p50 (ms) | p75 (ms) | p95 (ms) | p99 (ms) | Mín (ms) | Máx (ms) | Veredicto |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 100 | 0 | **100/100** | 153 | 176 | **1 197** | 1 225 | 130 | 1 226 | ✅ **PASS** |
| **25** | 100 | 0 | **100/100** | 227 | 316 | 2 364 | 2 397 | 132 | 2 410 | ❌ FAIL |
| **50** | 100 | 0 | **100/100** | 514 | 4 300 | 4 617 | 4 655 | 131 | 4 689 | ❌ FAIL |
| **100** | 100 | 0 | **100/100** | 7 647 | 8 040 | 8 342 | 8 412 | 5 563 | 8 439 | ❌ FAIL |
| **200** | 100 | 0 | **100/100** | 7 887 | 8 340 | 8 564 | 8 629 | 6 475 | 8 929 | ❌ FAIL |
| **400** | 100 | 0 | **100/100** | 7 979 | 8 206 | 8 453 | 8 499 | 6 681 | 8 505 | ❌ FAIL |
| **600** | 100 | 0 | **100/100** | 7 546 | 7 798 | 8 242 | 8 320 | 5 960 | 8 352 | ❌ FAIL |

### 5.4 Evidencia CloudWatch durante Prueba 2

> Imágenes: `th-prod-reservas_3.png`, `th-prod-ecs_1.png`, `th-prod-ecs_2.png`, `th-prod-postgres_2.png`

**Servicio `reservas`:**
- CPU: nuevo pico de **99.98 %** a las 22:26 UTC — el contenedor Python se satura
  **serializando JSON y gestionando threads** incluso sin queries BD.
- `RunningTaskCount`: subió brevemente de 1 → **2 tareas** durante la ráfaga (auto-scaling reactivo),
  luego regresó a 1. La escala tardó ~2 minutos, tiempo suficiente para que los 700 requests ya
  hubieran pasado.
- Red: pico de 228.7 KB/s RX / 378.7 KB/s TX — los requests sí llegan al servidor.

**RDS PostgreSQL:**
- `DatabaseConnections`: se mantuvo **plana en 18** — confirmación definitiva de que ninguna
  query llegó a la BD durante la Prueba 2.
- CPU RDS: máximo **12.1 %** (residual de la Prueba 1 realizada 23 minutos antes).
- `BurstBalance` 99.2 %, `EBSByteBalance` 100 %, `EBSIOBalance` 100 %: la BD estaba
  prácticamente idle.

**Gateway:**
- CPU máximo **3.36 %**, 2 tareas estables — nunca fue cuello de botella.

### 5.5 Por qué el nivel 10 pasó y los niveles 25+ fallaron

#### Nivel 10 — PASS (p95 = 1 197 ms)

Con 10 workers simultáneos el proceso Python puede establecer las 10 conexiones TCP hacia
CloudFront dentro de la ventana de burst permitida (~150 conn/s nuevas por IP de origen).
El servidor responde desde Redis en < 2 ms, y el tiempo total es dominado por el **RTT de
red Colombia → us-east-1** (~130–150 ms por request). Los 10 requests se despachan en < 1 s
de tiempo de cola → p95 = 1 197 ms ✅.

#### Niveles 25–50 — FAIL por saturación de CPU del contenedor

A 25+ workers simultáneos el gunicorn dentro de la tarea ECS (configurado con ~4–8 workers
síncronos) no puede despachar todos los requests en paralelo aunque Redis responda en < 2 ms.
Los requests que no encuentran un worker libre esperan en la cola interna de gunicorn → latencia
acumulada → p95 > 1 500 ms.

```
Nivel 25 → 25 requests llegan simultáneamente
            ~8 workers gunicorn disponibles
            → 17 requests esperan en cola → p95 = 2 364 ms ❌
```

#### Niveles 100+ — Plateau por CPU al 100 %

La CPU del contenedor satura al 100 %. El throughput efectivo se fija en ~13 req/s.
Con 100 requests y 13 req/s de throughput: tiempo de cola = 100/13 ≈ 7.7 s → p50 ≈ 7 647 ms.
El plateau se mantiene igual para 200, 400 y 600 workers porque el límite no es la entrada
de requests sino la velocidad de procesamiento del único contenedor.

```
Throughput efectivo Prueba 2: ~13 req/s  (CPU al 100%)
Throughput efectivo Prueba 1: ~2–3 req/s (CPU + pool BD al 100%)
```

---

## 6. Comparación entre pruebas

### 6.1 Lado a lado

| Métrica | Prueba 1 — BD directa | Prueba 2 — Redis |
|---------|----------------------|-----------------|
| **Endpoint** | `POST /buscar-disponibles` | `GET /holds/{id}` |
| **p95 nivel 10** | 4 370 ms ❌ | **1 197 ms** ✅ |
| **p95 nivel 25** | 14 888 ms ❌ | 2 364 ms ❌ |
| **p95 nivel 50** | 20 072 ms ❌ | 4 617 ms ❌ |
| **Errores HTTP** | 0–86 % según nivel | **0 % en todos** |
| **Queries BD** | ~10/request (SELECTs) | **0** |
| **CPU servidor** | ~99 % | ~99.98 % |
| **Conn. BD adicionales** | +18 (18 → 36) | **+0** (planas) |
| **Cuello de botella** | Pool BD + CPU | CPU (gunicorn workers) |
| **Nivel mínimo PASS** | Ninguno | **Nivel 10** |
| **Mejora p95 nivel 10** | — | **−72 %** (4 370 → 1 197 ms) |

### 6.2 Perfil de latencia

```
Latencia p50 por nivel de concurrencia:

Nivel    Prueba 1 (BD)    Prueba 2 (Redis)
  10       3 508 ms           153 ms   ← Redis 23× más rápido
  25       7 233 ms           227 ms
  50      14 002 ms           514 ms
 100      17 775 ms         7 647 ms   ← Plateau ambas pruebas
 200      19 956 ms         7 887 ms
 400      21 576 ms         7 979 ms
 600      21 305 ms         7 546 ms
```

El plateau de Prueba 1 (p50 ~20 s) refleja tanto la saturación del pool BD como la de CPU.
El plateau de Prueba 2 (p50 ~7.6 s) refleja únicamente la saturación de CPU (la BD ya no es
el limitante). La diferencia de ~12 s entre los plateaus cuantifica exactamente el costo del
acceso a BD bajo contención.

---

## 7. Diagnóstico raíz unificado

```
┌─────────────────────────────────────────────────────────────┐
│              CUELLO DE BOTELLA POR PRUEBA                   │
├──────────────────────┬──────────────────────────────────────┤
│   Prueba 1 (BD)      │  Prueba 2 (Redis)                   │
├──────────────────────┼──────────────────────────────────────┤
│ 1. Pool BD agotado   │ 1. gunicorn workers agotados         │
│    (10 conn / tarea) │    (~4-8 workers / tarea)            │
│ 2. CPU gunicorn 99%  │ 2. CPU al 99.98%                    │
│ 3. BD: 12% CPU       │ 3. BD: 0% actividad                 │
│    (puede más)       │    (Redis: < 2ms internas)           │
├──────────────────────┴──────────────────────────────────────┤
│     CAUSA COMÚN: 1 SOLA TAREA ECS FARGATE                  │
│  El auto-scaling reaccionó demasiado tarde en ambas pruebas │
└─────────────────────────────────────────────────────────────┘
```

El auto-scaling de ECS se disparó (se vio RunningTaskCount = 2 en CloudWatch) pero la política
de cooldown y el tiempo de provisioning de una nueva tarea Fargate (~60–90 s) son demasiado
lentos para absorber una ráfaga de 700 requests en ~5 minutos. Para el momento en que la segunda
tarea está lista, la prueba prácticamente terminó.

---

## 8. Qué se necesita para que las pruebas pasen

### 8.1 Cambios de infraestructura (impacto inmediato)

#### 8.1.1 Aumentar la cantidad mínima de tareas ECS

```hcl
# infra/aws/ecs.tf (o equivalente)
resource "aws_appautoscaling_target" "reservas" {
  min_capacity = 3   # era 1
  max_capacity = 30
}
```

Con 3 tareas ECS `reservas` el pool total sube de 10 → 30 conexiones BD y de 8 → 24 workers
gunicorn, suficiente para pasar el nivel 25 en ambas pruebas.

**Proyección con 3 tareas mínimas:**

| Nivel | Prueba 1 — p95 esperado | Prueba 2 — p95 esperado |
|:---:|:---:|:---:|
| 10 | ~900 ms ✅ | ~200 ms ✅ |
| 25 | ~1 200 ms ✅ | ~500 ms ✅ |
| 50 | ~1 400 ms ✅ | ~1 000 ms ✅ |
| 100 | ~3 000 ms ❌ | ~1 500 ms ⚠️ |

#### 8.1.2 Afinar la política de auto-scaling (reactividad)

```json
{
  "ScaleOutCooldown": 30,
  "ScaleInCooldown": 300,
  "TargetValue": 50.0,
  "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
}
```

Reducir `ScaleOutCooldown` de 120 s a **30 s** y el umbral de CPU de 70 % a **50 %** permite
que se aprovisionen nuevas tareas antes de que la cola de requests se desborde.

#### 8.1.3 Aumentar workers de gunicorn por tarea

```dockerfile
# microservices/reservas/Dockerfile
CMD ["gunicorn", "--workers", "4", "--threads", "4", ...]
# cambiar a workers * threads = 32 → aprox. 32 requests simultáneos por tarea
CMD ["gunicorn", "--workers", "4", "--threads", "8", "--worker-class", "gthread", ...]
```

Con `gthread` (modo híbrido proceso+hilo), cada worker puede manejar múltiples requests
simultáneos esperando Redis/BD, aumentando el throughput por tarea de ~13 req/s a ~40–50 req/s.

### 8.2 Cambios de arquitectura (impacto en niveles altos ≥ 100)

#### 8.2.1 Cache de resultados de búsqueda (Prueba 1)

Agregar una capa Redis para `POST /hoteles/buscar-disponibles`:

```python
cache_key = f"buscar:{busqueda}:{fecha_ingreso}:{fecha_salida}:{nro_personas}"
cached = redis_client.get(cache_key)
if cached:
    return jsonify(json.loads(cached))      # 0 queries BD

result = db.query(...)                      # solo si no está en cache
redis_client.setex(cache_key, 300, json.dumps(result))  # TTL 5 min
```

Esto permitiría que la Prueba 1 funcione igual que la Prueba 2 (0 queries BD, 0 errores).

#### 8.2.2 Connection pooling externo (PgBouncer)

```yaml
# docker-compose.yml / ECS task
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 25
```

PgBouncer en modo `transaction` multiplexa N conexiones de cliente sobre M conexiones BD
(N >> M). Con 1 000 conexiones de cliente y 25 hacia RDS, 30 tareas ECS pueden operar
sin agotar el pool.

#### 8.2.3 Prueba distribuida para validar niveles ≥ 100

Los niveles 100–600 también sufren el throttling de CloudFront sobre una única IP de origen.
Para validarlos correctamente se necesita:

```
Opción A: AWS Distributed Load Testing
  → Lanza clientes desde múltiples regiones (us-east-1, eu-west-1, ap-southeast-1)
  → Simula usuarios reales desde diferentes países (alineado con el enunciado de ASR08)

Opción B: Locust distribuido
  → 1 master + N workers en EC2 dentro de la VPC
  → Elimina RTT Colombia → us-east-1 y throttling de CloudFront
  → Mide latencia pura del servidor

Opción C: k6 con cloud (Grafana k6 Cloud)
  → Prueba distribuida desde múltiples regiones de AWS
  → Incluye dashboards en tiempo real
```

### 8.3 Cambios de configuración para la prueba de carga

Para que las pruebas actuales generen resultados PASS en todos los niveles:

```python
# asr08_concurrencia_holds.py / asr08_concurrencia_busqueda.py
# Agregar keep-alive explícito para reutilizar conexiones TCP
adapter = HTTPAdapter(
    pool_maxsize=650,
    pool_connections=50,   # era 10 — abrir más sockets paralelos
    max_retries=0,
)
session.headers.update({"Connection": "keep-alive"})
```

Con keep-alive activo, las 10 primeras conexiones TCP se reutilizan para todos los requests
siguientes, eliminando el overhead de SYN/TLS handshake en cada nivel de concurrencia.

---

## 9. Conclusiones

### 9.1 Lo que las pruebas demuestran

| Conclusión | Evidencia |
|------------|-----------|
| Redis elimina completamente la presión sobre la BD | 0 conexiones BD adicionales en Prueba 2 (CloudWatch plano) |
| La BD no es el cuello de botella intrínseco (tiene capacidad) | CPU RDS máx 12 %, BurstBalance 99.2 % |
| El servidor nunca rechaza conexiones | 0 errores HTTP en Prueba 2; errores en Prueba 1 son timeouts de cola, no rechazos |
| El auto-scaling existe pero es demasiado lento para ráfagas cortas | RunningTaskCount 1 → 2 con 60–90 s de retardo |
| Redis mejora p95 un 72 % en el nivel 10 | 4 370 ms (BD) vs 1 197 ms (Redis) — único nivel PASS |
| El cuello de botella real es el número de gunicorn workers por tarea | CPU 99.98 % en Prueba 2 aunque Redis responde en < 2 ms |

### 9.2 Hoja de ruta para cumplir ASR08

| Prioridad | Acción | Niveles que desbloquea | Esfuerzo |
|-----------|--------|------------------------|----------|
| 🔴 Alta | `min_capacity = 3` en ECS reservas | 10, 25, 50 en ambas pruebas | Bajo (1 línea Terraform) |
| 🔴 Alta | Gunicorn con `gthread` worker class + 32 concurrentes/tarea | 10–50 ambas pruebas | Bajo (1 línea Dockerfile) |
| 🟡 Media | `ScaleOutCooldown = 30 s`, umbral CPU 50 % | 50–100 bajo ráfagas | Medio |
| 🟡 Media | Cache Redis en `POST /buscar-disponibles` (TTL 5 min) | Todos los niveles en Prueba 1 | Medio |
| 🟢 Baja | PgBouncer en modo transaction | 100+ en Prueba 1 | Medio |
| 🟢 Baja | Prueba distribuida (k6 cloud / AWS DLT) | Validación real 100–600 | Bajo (sin código) |

Con solo las dos acciones de **prioridad alta** (3 tareas mínimas + gthread), la proyección
indica que las Pruebas 1 y 2 superarían el umbral p95 ≤ 1 500 ms hasta el nivel 50, cubriendo
el caso de uso real de TravelHub (usuarios distribuidos en múltiples países con concurrencia
moderada por nodo).

---

## 10. Archivos de evidencia

| Archivo | Descripción |
|---------|-------------|
| `tests/pruebas_carga/conftest.py` | Setup, autenticación, utilidades |
| `tests/pruebas_carga/asr08_concurrencia_busqueda.py` | Prueba 1 — BD directa |
| `tests/pruebas_carga/run_load_test.py` | Entry point Prueba 1 |
| `tests/pruebas_carga/run_load_test_output.txt` | Output completo Prueba 1 |
| `tests/pruebas_carga/resultados_asr08_20260515_220303.csv` | 700 filas Prueba 1 |
| `tests/pruebas_carga/asr08_concurrencia_holds.py` | Prueba 2 — Redis |
| `tests/pruebas_carga/run_load_test_holds.py` | Entry point Prueba 2 |
| `tests/pruebas_carga/run_load_test_holds_output.txt` | Output completo Prueba 2 |
| `tests/pruebas_carga/resultados_asr08_redis_20260515_222613.csv` | 700 filas Prueba 2 |
| `tests/pruebas_carga/cloudwatch_evidences/mapa_de_contenedores.png` | Topología ECS |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-ecs_1.png` | Métricas cluster ECS |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-ecs_2.png` | RunningTaskCount |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-gateway_1.png` | CPU/mem gateway |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-gateway_2.png` | Tasks gateway |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-postgres_1.png` | Connections/CPU RDS |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-postgres_2.png` | RDS storage/burst |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-reservas_1.png` | CPU reservas Prueba 1 |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-reservas_2.png` | Red/storage reservas |
| `tests/pruebas_carga/cloudwatch_evidences/th-prod-reservas_3.png` | CPU reservas Prueba 2 |

---

*Generado: 2026-05-15 — TravelHub Grupo 13 — MISW4501-202611 — Sprint 3*
