"""
run_all.py — Ejecutor completo de evidencia ASR Sprint 2

Corre los 4 benchmarks de performance en secuencia usando el mismo
contexto de autenticación e imprime una tabla resumen al finalizar.

Uso:
    python run_all.py

Salida esperada al final:
    ╔══════╦══════════════════════════════════════╦═══════╦════════════╦══════════╗
    ║ ASR  ║ Escenario                            ║  n    ║  p95 (ms)  ║ Veredicto║
    ╠══════╬══════════════════════════════════════╬═══════╬════════════╬══════════╣
    ║ ASR03║ Carga rápida detalle de hotel        ║  100  ║   XXX.X    ║  ✅ PASS ║
    ║ ASR04║ Creación rápida de una reserva       ║   50  ║   XXX.X    ║  ✅ PASS ║
    ║ ASR05║ Procesamiento ágil de pagos          ║   30  ║  XXXX.X    ║  ✅ PASS ║
    ║ ASR06║ Carga rápida del histórico           ║  100  ║   XXX.X    ║  ✅ PASS ║
    ╚══════╩══════════════════════════════════════╩═══════╩════════════╩══════════╝
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from conftest import setup  # noqa: E402
import asr03_hotel_detail      as asr03  # noqa: E402
import asr04_crear_reserva     as asr04  # noqa: E402
import asr05_procesar_pago     as asr05  # noqa: E402
import asr06_historial_reservas as asr06  # noqa: E402


def main():
    print("=" * 70)
    print("  EVIDENCIA ASR SPRINT 2 — TravelHub")
    print(f"  Fecha de ejecución: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Un único login / setup compartido para todos los scripts
    ctx = setup(verbose=True)

    # Ejecutar benchmarks en orden -------------------------------------------
    results = []
    for mod in (asr03, asr04, asr05, asr06):
        result = mod.run_benchmark(ctx)
        results.append(result)

    # Tabla resumen ------------------------------------------------------------
    print("\n")
    print("=" * 70)
    print("  RESUMEN EJECUTIVO — Sprint 2")
    print("=" * 70)

    header = f"{'ASR':<8} {'Escenario':<38} {'n':>5}  {'p95(ms)':>9}  {'Umbral medido':>14}  {'Veredicto'}"
    sep    = "-" * 80
    print(header)
    print(sep)

    all_passed = True
    for r in results:
        if r["latencies"]:
            from conftest import percentile
            p95 = percentile(sorted(r["latencies"]), 95)
        else:
            p95 = float("inf")

        verdict    = "✅ PASS" if r["passed"] else "❌ FAIL"
        all_passed = all_passed and r["passed"]

        print(
            f"{r['asr']:<8} {r['name']:<38} {r['n']:>5}  {p95:>9.1f}  "
            f"{r['threshold']:>14.0f}  {verdict}"
        )

    print(sep)
    overall = "✅ TODOS LOS ASRs CUMPLEN" if all_passed else "❌ HAY ASRs QUE NO CUMPLEN"
    print(f"\n  RESULTADO GLOBAL: {overall}\n")
    print("  Copiar esta tabla en docs/EVIDENCIA_ASR_SPRINT2.md")
    print("=" * 70)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
