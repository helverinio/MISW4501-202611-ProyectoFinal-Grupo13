"""
run_all.py — Ejecutor de evidencia ASR Sprint 3

Corre el benchmark de performance ejecutable (ASR06) y reporta los demás
ASRs del sprint según su modalidad de validación:

  ASR05 — Procesamiento ágil de pagos        → reutilizado de Sprint 2
           (endpoint POST /payments/{id}/process no se re-ejecuta por
            instrucción del equipo; resultado Sprint 2: p95=864.0ms ≤ 3000ms)
  ASR06 — Carga rápida del histórico         → benchmark automático (este script)
  ASR17 — Cumplimiento GDPR/LGPD             → validación por inspección de código
  ASR18 — Auditoría de cambios               → validación funcional (Sprint 2 base
           + extensión HU-P-23 admin confirmar/rechazar reserva)

Uso:
    python run_all.py
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from conftest import setup, percentile  # noqa: E402
import asr06_historial_reservas as asr06  # noqa: E402


def main():
    print("=" * 70)
    print("  EVIDENCIA ASR SPRINT 3 — TravelHub")
    print(f"  Fecha de ejecución: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Un único login / setup compartido para todos los scripts
    ctx = setup(verbose=True)

    # Ejecutar benchmarks automáticos ----------------------------------------
    results = []

    # ASR06 — benchmark automatizado
    r06 = asr06.run_benchmark(ctx)
    results.append(r06)

    # Tabla resumen ------------------------------------------------------------
    print("\n")
    print("=" * 70)
    print("  RESUMEN EJECUTIVO — Sprint 3")
    print("=" * 70)

    header = f"{'ASR':<8} {'Escenario':<38} {'n':>5}  {'p95(ms)':>9}  {'Umbral':>8}  {'Veredicto'}"
    sep    = "-" * 80
    print(header)
    print(sep)

    all_passed = True

    # Fila ASR05 — resultado reutilizado de Sprint 2
    print(
        f"{'ASR05':<8} {'Procesamiento agil de pagos':<38} {'30':>5}  {'864.0':>9}  "
        f"{'3000':>8}  ✅ PASS  [reutilizado Sprint 2]"
    )

    # Filas de benchmarks ejecutados
    for r in results:
        if r["latencies"]:
            p95 = percentile(sorted(r["latencies"]), 95)
        else:
            p95 = float("inf")

        verdict    = "✅ PASS" if r["passed"] else "❌ FAIL"
        all_passed = all_passed and r["passed"]

        print(
            f"{r['asr']:<8} {r['name']:<38} {r['n']:>5}  {p95:>9.1f}  "
            f"{r['threshold']:>8.0f}  {verdict}"
        )

    # Filas de ASRs funcionales / inspección de código
    print(
        f"{'ASR17':<8} {'Cumplimiento GDPR/LGPD':<38} {'N/A':>5}  {'N/A':>9}  "
        f"{'N/A':>8}  ✅ CUMPLE  [inspección de código]"
    )
    print(
        f"{'ASR18':<8} {'Auditoria de cambios':<38} {'N/A':>5}  {'N/A':>9}  "
        f"{'N/A':>8}  ✅ CUMPLE  [validación funcional]"
    )

    print(sep)
    overall = "✅ TODOS LOS ASRs CUMPLEN" if all_passed else "❌ HAY ASRs QUE NO CUMPLEN"
    print(f"\n  RESULTADO GLOBAL: {overall}\n")
    print("  Copiar esta tabla en docs/EVIDENCIA_ASR_SPRINT3.md")
    print("=" * 70)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
