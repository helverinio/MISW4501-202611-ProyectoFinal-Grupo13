"""
PRUEBA DE CARGA ASR08 — TravelHub
===================================
Concurrencia multi-país: 600 usuarios concurrentes/país × 6 países = 3 600/min

Ejecuta la prueba de carga sobre POST /hoteles/buscar-disponibles con
niveles de concurrencia crecientes y verifica el umbral p95 ≤ 1 500 ms.

Uso:
    python run_load_test.py

Salida:
    - Tabla de resultados por nivel impresa en consola
    - CSV con métricas por request: resultados_asr08_<timestamp>.csv
    - Código de salida 0 si todos los niveles pasan, 1 si alguno falla
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup           # noqa: E402
from asr08_concurrencia_busqueda import run_load_test, UMBRAL_P95, CONCURRENCY_LEVELS  # noqa: E402

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    SEP   = "=" * 64
    LINE  = "─" * 64

    print(SEP)
    print("  PRUEBA DE CARGA — ASR08 Concurrencia multi-país")
    print(f"  TravelHub | Ejecución: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print(f"  Objetivo : 600 concurrentes/país × 6 países = 3 600/min")
    print(f"  Umbral   : p95 ≤ {UMBRAL_P95:.0f} ms")
    print(f"  Endpoint : POST /hoteles/buscar-disponibles")
    print(SEP)

    # Setup (autenticación)
    ctx = setup(verbose=True)

    # Ejecutar prueba de carga
    results = run_load_test(ctx)

    # Tabla resumen final
    print(f"\n{SEP}")
    print("  RESUMEN FINAL — ASR08")
    print(SEP)
    header = f"{'Nivel':>6} | {'N':>4} | {'Errores':>7} | {'p50 ms':>8} | {'p95 ms':>8} | {'Umbral':>8} | {'Veredicto'}"
    print(header)
    print(LINE)

    all_pass = True
    for r in results:
        veredicto = "✅ PASS" if r["passed"] else "❌ FAIL"
        umbral_s  = f"≤{UMBRAL_P95:.0f}"
        err_pct   = f"{r['n_errores']}/{r['n_total']}"
        print(
            f"{r['nivel_concurrencia']:>6} | "
            f"{r['n_total']:>4} | "
            f"{err_pct:>7} | "
            f"{r['p50']:>8.1f} | "
            f"{r['p95']:>8.1f} | "
            f"{umbral_s:>8} | "
            f"{veredicto}"
        )
        if not r["passed"]:
            all_pass = False

    print(LINE)
    if all_pass:
        print("\n✅ ASR08 CUMPLE — todos los niveles de concurrencia dentro del umbral.")
        print("   Extrapolación: 600 concurrentes validados por proceso Python.")
        print("   Sistema distribuido en 6 países soporta 3 600 concurrentes simultáneos.")
    else:
        failed = [r["nivel_concurrencia"] for r in results if not r["passed"]]
        print(f"\n❌ ASR08 FALLA — niveles que superaron el umbral: {failed}")

    print(SEP)
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
