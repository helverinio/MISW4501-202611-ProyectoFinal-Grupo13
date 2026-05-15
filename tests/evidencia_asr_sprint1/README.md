# Evidencia ASR Sprint 1 — Scripts de benchmark

## Descripción

Scripts de validación de los Atributos de Calidad del Sistema (ASR) correspondientes
al **Sprint 1** del proyecto TravelHub (MISW4501-202611 Grupo 13).

## ASRs del Sprint 1

| ASR | Escenario | Umbral (server-side) | Umbral medido | Endpoint | Acción |
|-----|-----------|----------------------|---------------|----------|--------|
| ASR01 | Búsqueda rápida de hospedajes | p95 ≤ 800 ms | p95 ≤ 1 500 ms | `POST /hoteles/buscar-disponibles` | Script nuevo |
| ASR02 | Consulta rápida de disponibilidad | **p99** ≤ 200 ms | p99 ≤ 900 ms | `GET /hoteles/{id}/habitaciones` | Script nuevo |
| ASR03 | Carga rápida detalle de hotel | p95 ≤ 500 ms | p95 ≤ 1 200 ms | `GET /hoteles/{id}` | Reutiliza Sprint 2 |
| ASR04 | Creación rápida de una reserva | p95 ≤ 1 500 ms | p95 ≤ 2 500 ms | `POST /hold` + `POST /reservas` | Reutiliza Sprint 2 |
| ASR16 | Protección contra ataques comunes | Funcional | N/A | Inspección de código + tests | Reutiliza Sprint 2 |

> **ASR04 y correos:** La HU TFP-15.2 requiere confirmación por correo al crear una reserva.
> Para evitar disparar correos en masa, ASR04 reutiliza los resultados del Sprint 2
> (50 iteraciones validadas). No se re-ejecuta en este sprint.

## Estructura

```
tests/evidencia_asr_sprint1/
├── conftest.py                      # Setup compartido (login, IDs de recursos)
├── asr01_buscar_hoteles.py          # Benchmark ASR01 — POST /hoteles/buscar-disponibles
├── asr02_disponibilidad_hotel.py    # Benchmark ASR02 — GET /hoteles/{id}/habitaciones (p99)
├── run_all.py                       # Orquestador: corre ASR01 + ASR02
├── run_all_output.txt               # Salida capturada del último run_all.py
└── README.md                        # Este archivo
```

## Prerrequisitos

```bash
pip install requests
```

El entorno virtual del proyecto ya incluye `requests`. Activar con:

```powershell
# Windows (PowerShell)
.\.venv-1\Scripts\Activate.ps1
```

## Ejecución

### Todos los benchmarks nuevos (ASR01 + ASR02)

```bash
python tests/evidencia_asr_sprint1/run_all.py
```

### Script individual

```bash
python tests/evidencia_asr_sprint1/asr01_buscar_hoteles.py
python tests/evidencia_asr_sprint1/asr02_disponibilidad_hotel.py
```

## Notas metodológicas

### Overhead de red (~700 ms)

Los scripts se ejecutan desde Colombia hacia AWS us-east-1 (CloudFront). El
round-trip de red agrega aproximadamente 635–700 ms a cada medición. Los umbrales
`medidos` ya incorporan este overhead. Ver **Apéndice A** en
`docs/EVIDENCIA_ASR_SPRINT1.md` para la justificación completa.

### ASR02 — Métrica p99

El backlog define el umbral de ASR02 como `p99 ≤ 200 ms` (server-side), a
diferencia de ASR01/ASR03/ASR04 que usan p95. El script `asr02_disponibilidad_hotel.py`
utiliza `print_stats_p99()` del conftest para reportar correctamente el percentil 99.

### Sin correos en ASR01/ASR02

`POST /hoteles/buscar-disponibles` y `GET /hoteles/{id}/habitaciones` son
operaciones de consulta pura. No crean holds, no generan reservas y no disparan
notificaciones por correo electrónico.
