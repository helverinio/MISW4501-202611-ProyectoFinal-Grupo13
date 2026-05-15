"""
ASR01 — Búsqueda rápida de hospedajes
Umbral ASR:    p95 ≤ 800 ms (server-side)
Umbral medido: p95 ≤ 1 500 ms (+700 ms overhead de red cliente->AWS us-east-1)

Ejecuta 100 llamadas POST /hoteles/buscar-disponibles contra producción
y verifica que el percentil 95 de latencia sea ≤ 1 500 ms.

HU asociadas:
  - HU-W-17 Búsqueda avanzada de hospedaje
  - HU-M-26 Búsqueda de hospedaje desde la app

Uso:
    python asr01_buscar_hoteles.py
"""

import sys
import os
import time
import requests
from datetime import date, timedelta

# Añadir directorio propio al path para importar conftest
sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, print_stats  # noqa: E402

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS  = 100
UMBRAL_P95  = 1500.0  # ms — ASR define 800ms server-side; +700ms overhead red cliente->AWS us-east-1
ASR_CODE    = "ASR01"
ASR_NAME    = "Búsqueda rápida de hospedajes"

# Fecha base para las búsquedas (futura, sin hold ni reserva → sin correo)
_SEARCH_OFFSET_DAYS = 60   # today + 60 días como fecha de entrada de búsqueda


def _search_payload(iteration: int) -> dict:
    """Genera un payload de búsqueda variando ligeramente las fechas."""
    today = date.today()
    # Variar fecha de ingreso +/- 1 día para evitar respuestas cacheadas
    offset = _SEARCH_OFFSET_DAYS + (iteration % 5)
    fecha_ingreso = today + timedelta(days=offset)
    fecha_salida  = fecha_ingreso + timedelta(days=3)
    return {
        "busqueda":     "Bogota",
        "fecha_ingreso": fecha_ingreso.isoformat(),
        "fecha_salida":  fecha_salida.isoformat(),
        "nro_personas":  2,
    }


# ---------------------------------------------------------------------------
# Función de benchmark (reutilizable desde run_all.py)
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR01 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    headers = ctx["headers"]
    url     = f"{BASE_URL}/hoteles/buscar-disponibles"

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} llamadas a POST /hoteles/buscar-disponibles …")
    print(f"  Búsqueda: 'Bogota', fechas futuras rotadas, 2 personas")
    print(f"  Umbral medido p95: {UMBRAL_P95:.0f} ms (server-side 800 ms + ~700 ms red)")

    latencies_ms = []
    errors       = 0

    for i in range(N_LLAMADAS):
        payload = _search_payload(i)
        t0 = time.perf_counter()
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=15)
            elapsed = (time.perf_counter() - t0) * 1000.0
            if r.status_code == 200:
                latencies_ms.append(elapsed)
            else:
                errors += 1
                print(f"  [WARN] iter {i+1}: HTTP {r.status_code} — {r.text[:120]}")
        except requests.RequestException as exc:
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
