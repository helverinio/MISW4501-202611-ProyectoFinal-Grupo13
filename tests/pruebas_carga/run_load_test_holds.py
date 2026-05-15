"""
PRUEBA DE CARGA ASR08 — Redis GET /holds/{hold_id}
====================================================

Valida ASR08 usando el endpoint de cache Redis:
  GET /holds/{hold_id}

El servidor sirve el hold directamente desde Redis sin consultar la BD.
La latencia esperada es ~700-900ms (overhead de red Colombia -> AWS us-east-1).

Uso:
    python run_load_test_holds.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from conftest import setup                            # noqa: E402
from asr08_concurrencia_holds import (               # noqa: E402
    create_test_hold,
    run_load_test,
    CONCURRENCY_LEVELS,
    UMBRAL_P95,
)

# ---------------------------------------------------------------------------
def main():
    print("=" * 64)
    print("  PRUEBA DE CARGA ASR08 — GET /holds (Redis cache)")
    print("=" * 64)

    ctx = setup(verbose=True)

    # Crear hold de prueba (TTL 15min > duracion estimada ~5min)
    hold_id = create_test_hold(ctx)

    # Ejecutar prueba en todos los niveles
    results = run_load_test(ctx, hold_id)

    # -----------------------------------------------------------------------
    # Tabla resumen
    # -----------------------------------------------------------------------
    SEP  = "=" * 80
    HDR  = (
        f"{'Nivel':>6} | {'N':>4} | {'Errores':>7} | {'CacheHits':>9} |"
        f" {'p50ms':>7} | {'p95ms':>7} | {'Umbral':>8} | {'Veredicto':>9}"
    )
    print(f"\n{SEP}")
    print("  RESUMEN FINAL — ASR08 Redis (GET /holds)")
    print(SEP)
    print(HDR)
    print("-" * 80)

    all_pass = True
    for r in results:
        verdict   = "PASS" if r["passed"] else "FAIL"
        all_pass  = all_pass and r["passed"]
        umbral_str = f"{UMBRAL_P95:.0f}ms"
        print(
            f"{r['nivel_concurrencia']:>6} | {r['n_total']:>4} | {r['n_errores']:>7} |"
            f" {r['n_hits']:>9} | {r['p50']:>7.1f} | {r['p95']:>7.1f} |"
            f" {umbral_str:>8} | {verdict:>9}"
        )

    print(SEP)
    print(f"\n  Niveles probados : {CONCURRENCY_LEVELS}")
    print(f"  Umbral p95       : {UMBRAL_P95:.0f} ms")
    print(f"\n  RESULTADO GLOBAL : {'PASS -- todos los niveles aprobaron' if all_pass else 'FAIL -- uno o mas niveles fallaron'}")
    print(SEP)

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
