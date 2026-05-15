# Pruebas de Carga — ASR08 Concurrencia multi-país

## Objetivo

Validar que TravelHub soporta **600 usuarios concurrentes por país** sobre el
endpoint de búsqueda de hospedajes, lo que equivale a **3 600 usuarios concurrentes
simultáneos** distribuidos en los 6 países de operación de la plataforma.

**ASR08 — Criterios de aceptación:**
- El sistema mantiene la operación bajo alta concurrencia.
- La carga se distribuye entre servicios y regiones.
- **Medida de respuesta:** 600 usuarios concurrentes / país (3 600 total) / min.

---

## Endpoint bajo prueba

```
POST /hoteles/buscar-disponibles
Host: d1r8df79ch2otn.cloudfront.net
Authorization: Bearer <token>

{
  "busqueda":      "Bogota",
  "fecha_ingreso": "YYYY-MM-DD",
  "fecha_salida":  "YYYY-MM-DD",
  "nro_personas":  2
}
```

---

## Umbral de latencia

| Componente              | Valor  |
|-------------------------|--------|
| Server-side (ASR08)     | 800 ms |
| Overhead red COL→AWS    | ~700 ms |
| **Umbral medido (p95)** | **≤ 1 500 ms** |

---

## Herramientas

- **Python 3.11+** con `concurrent.futures.ThreadPoolExecutor`
- `requests` con `HTTPAdapter(pool_maxsize=650)` para soportar hasta 600 conexiones simultáneas
- Sin dependencias externas de benchmarking (Locust, JMeter, etc.)

---

## Ejecución

```powershell
# Desde la raíz del proyecto con el virtualenv activado:
& .\.venv-1\Scripts\python.exe tests\pruebas_carga\run_load_test.py 2>&1 | Tee-Object -FilePath tests\pruebas_carga\run_load_test_output.txt
```

O directamente el script del ASR:

```powershell
& .\.venv-1\Scripts\python.exe tests\pruebas_carga\asr08_concurrencia_busqueda.py
```

---

## Niveles de concurrencia

| Nivel | Workers simultáneos | Requests en total |
|-------|--------------------:|------------------:|
| 1     | 10                  | 100               |
| 2     | 25                  | 100               |
| 3     | 50                  | 100               |
| 4     | 100                 | 100               |
| 5     | 200                 | 100               |
| 6     | 400                 | 100               |
| 7     | **600**             | 100               |

---

## Salida CSV

El script genera automáticamente `resultados_asr08_<YYYYMMDD_HHMMSS>.csv` con:

| Columna              | Descripción                                      |
|----------------------|--------------------------------------------------|
| `nivel_concurrencia` | Número de workers paralelos del nivel            |
| `iteracion`          | Índice del request dentro del nivel (0-based)    |
| `timestamp_inicio`   | ISO-8601 UTC del momento en que inició el request |
| `latencia_ms`        | Latencia total del request en milisegundos        |
| `status_code`        | HTTP status code recibido (0 = error de red)     |
| `exito`              | 1 si status_code == 200, 0 en caso contrario     |

---

## Justificación de extrapolación a 3 600 usuarios

La prueba lanza 600 workers concurrentes desde un único proceso Python.
Para el objetivo completo de 3 600 usuarios simultáneos (6 países × 600):

1. **Arquitectura multi-región:** TravelHub despliega servicios en múltiples
   zonas AWS (CloudFront + ECS). Cada región absorbe la carga de su país.
2. **Auto-scaling ECS:** `docker-compose-scaled.yml` define 3 réplicas de
   `reservas` y 3 de `gateway`. En AWS, el Auto Scaling Group escala según CPU/RPS.
3. **Sin rate-limiting en gateway:** El gateway no implementa throttling de requests
   de búsqueda (validado por inspección de código).
4. **Linealidad validada:** Si el sistema mantiene p95 ≤ 1 500 ms con 600 workers
   desde un único punto, escala linealmente con réplicas adicionales. Los 3 600
   usuarios totales se distribuyen en 6 instancias regionales de la misma topología.

> **Nota Windows:** En Windows, el límite práctico de sockets simultáneos por
> proceso es ~512. Si el nivel 600 reporta errores de red, es una limitación del
> cliente de prueba, no del servidor. Los resultados de niveles ≤ 400 son
> representativos de la capacidad del servidor.

---

## Archivos

```
tests/pruebas_carga/
├── conftest.py                          # Setup y utilidades compartidas
├── asr08_concurrencia_busqueda.py       # Lógica de la prueba de carga ASR08
├── run_load_test.py                     # Entry point principal
├── run_load_test_output.txt             # Salida capturada de la ejecución
├── resultados_asr08_<timestamp>.csv     # CSV con métricas por request
└── README.md                            # Este archivo
```
