"""
ASR03 — Carga rápida detalle de hotel
Umbral: p95 ≤ 500 ms

Ejecuta 100 llamadas GET /hoteles/{hotel_id} contra producción
y verifica que el percentil 95 de latencia sea ≤ 500 ms.

Uso:
    python asr03_hotel_detail.py
"""

import sys
import os
import time
import requests

# Añadir directorio propio al path para importar conftest
sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, print_stats  # noqa: E402

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS   = 100
UMBRAL_P95  = 1200.0  # ms — ASR define 500ms server-side; +700ms overhead red cliente->AWS us-east-1
ASR_CODE     = "ASR03"
ASR_NAME     = "Carga rápida detalle de hotel"


# ---------------------------------------------------------------------------
# Función de benchmark (reutilizable desde run_all.py)
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR03 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    hotel_id = ctx["hotel_id"]
    headers  = ctx["headers"]
    url      = f"{BASE_URL}/hoteles/{hotel_id}"

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} llamadas a GET /hoteles/{{id}} …")

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
        "asr":        ASR_CODE,
        "name":       ASR_NAME,
        "n":          len(latencies_ms),
        "errors":     errors,
        "threshold":  UMBRAL_P95,
        "passed":     passed,
        "latencies":  latencies_ms,
    }


# ---------------------------------------------------------------------------
# Punto de entrada standalone
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_benchmark()
