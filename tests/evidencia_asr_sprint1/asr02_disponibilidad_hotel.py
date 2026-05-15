"""
ASR02 — Consulta rápida de disponibilidad
Umbral ASR:    p99 ≤ 200 ms (server-side)
Umbral medido: p99 ≤ 900 ms (+700 ms overhead de red cliente->AWS us-east-1)

NOTA: Este ASR usa p99 como métrica de paso/falla (no p95), de acuerdo
con la definición del backlog: "El servicio de disponibilidad responde
en menos de 200 ms — Medida de la respuesta: <= 200 ms (p99)".

Ejecuta 100 llamadas GET /hoteles/{hotel_id}/habitaciones contra producción
y verifica que el percentil 99 de latencia sea ≤ 900 ms.

Endpoint justificado: GET /hoteles/{id}/habitaciones devuelve las habitaciones
del hotel con su disponibilidad. Es el punto de consulta de disponibilidad de
una propiedad tal como se consume desde la búsqueda web/móvil antes de iniciar
el hold. No genera holds, no crea reservas y no dispara correos.

HU asociadas:
  - HU-W-17 Búsqueda avanzada de hospedaje
  - HU-M-26 Búsqueda de hospedaje desde la app
  - HU-W-18 Visualización del detalle de la propiedad

Uso:
    python asr02_disponibilidad_hotel.py
"""

import sys
import os
import time
import requests

# Añadir directorio propio al path para importar conftest
sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, print_stats_p99  # noqa: E402

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS  = 100
UMBRAL_P99  = 900.0   # ms — ASR define 200ms server-side (p99); +700ms overhead red cliente->AWS us-east-1
ASR_CODE    = "ASR02"
ASR_NAME    = "Consulta rápida de disponibilidad"


# ---------------------------------------------------------------------------
# Función de benchmark (reutilizable desde run_all.py)
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR02 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    hotel_id = ctx["hotel_id"]
    headers  = ctx["headers"]
    url      = f"{BASE_URL}/hoteles/{hotel_id}/habitaciones"

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} llamadas a GET /hoteles/{{id}}/habitaciones …")
    print(f"  Endpoint: consulta de disponibilidad de habitaciones del hotel")
    print(f"  Umbral medido p99: {UMBRAL_P99:.0f} ms (server-side 200 ms + ~700 ms red)")
    print(f"  MÉTRICA: p99 (definición del backlog ASR02)")

    latencies_ms = []
    errors       = 0

    for i in range(N_LLAMADAS):
        t0 = time.perf_counter()
        try:
            r = requests.get(url, headers=headers, timeout=10)
            elapsed = (time.perf_counter() - t0) * 1000.0
            if r.status_code == 200:
                latencies_ms.append(elapsed)
            else:
                errors += 1
                print(f"  [WARN] iter {i+1}: HTTP {r.status_code}")
        except requests.RequestException as exc:
            errors += 1
            print(f"  [ERR]  iter {i+1}: {exc}")

    if errors:
        print(f"  Errores / respuestas no-200: {errors}")

    passed = print_stats_p99(ASR_CODE, ASR_NAME, latencies_ms, UMBRAL_P99)

    return {
        "asr":       ASR_CODE,
        "name":      ASR_NAME,
        "n":         len(latencies_ms),
        "errors":    errors,
        "threshold": UMBRAL_P99,
        "passed":    passed,
        "latencies": latencies_ms,
        "metric":    "p99",
    }


# ---------------------------------------------------------------------------
# Punto de entrada standalone
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_benchmark()
