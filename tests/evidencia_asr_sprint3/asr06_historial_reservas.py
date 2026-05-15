"""
ASR06 — Carga rápida del histórico de reservas  (Sprint 3)
Umbral: p95 ≤ 1 000 ms (server-side) + ~1 000 ms overhead red Colombia→AWS us-east-1
        → umbral efectivo cliente = 2 000 ms

Ejecuta 100 llamadas GET /usuarios/{user_id}/reservas contra producción
y verifica que el percentil 95 de latencia medido desde el cliente sea ≤ 2 000 ms.

HUs cubiertas: HU-M-12 - Consulta de Mis Reservas móvil

Uso:
    python asr06_historial_reservas.py
"""

import sys
import os
import time
import requests

sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, print_stats  # noqa: E402

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS  = 100
UMBRAL_P95  = 2000.0  # ms — ASR define 1000ms server-side; +1000ms overhead red cliente->AWS us-east-1
ASR_CODE    = "ASR06"
ASR_NAME    = "Carga rapida del historico de reservas"


# ---------------------------------------------------------------------------
# Función de benchmark
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR06 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    user_id = ctx["user_id"]
    headers = ctx["headers"]
    url     = f"{BASE_URL}/usuarios/{user_id}/reservas"

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} llamadas a GET /usuarios/{{id}}/reservas …")

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
            elapsed = (time.perf_counter() - t0) * 1000.0
            errors += 1
            print(f"  [ERR]  iter {i+1}: {exc}")

    if errors:
        print(f"  Errores / respuestas no-200: {errors}")

    passed = print_stats(ASR_CODE, ASR_NAME, latencies_ms, UMBRAL_P95)

    return {
        "asr":       ASR_CODE,
        "name":      ASR_NAME,
        "n":         len(latencies_ms),
        "errors":    errors,
        "threshold": UMBRAL_P95,
        "passed":    passed,
        "latencies": latencies_ms,
        "metric":    "p95",
    }


# ---------------------------------------------------------------------------
# Punto de entrada standalone
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_benchmark()
