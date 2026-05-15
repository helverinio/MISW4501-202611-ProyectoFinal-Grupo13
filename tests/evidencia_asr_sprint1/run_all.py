"""
run_all.py — Ejecutor completo de evidencia ASR Sprint 1

Corre los 2 benchmarks de performance nuevos (ASR01, ASR02) en secuencia
usando el mismo contexto de autenticación e imprime una tabla resumen.

ASR03, ASR04 y ASR16 se reutilizan del Sprint 2 (mismos endpoints, misma
infraestructura). Sus resultados se registran en EVIDENCIA_ASR_SPRINT1.md.

Uso:
    python run_all.py

Salida esperada al final:
    ╔══════╦══════════════════════════════════════╦═══════╦════════════╦══════════╗
    ║ ASR  ║ Escenario                            ║  n    ║  p9X (ms)  ║ Veredicto║
    ╠══════╬══════════════════════════════════════╬═══════╬════════════╬══════════╣
    ║ ASR01║ Búsqueda rápida de hospedajes        ║  100  ║   XXX.X    ║  ✅ PASS ║
    ║ ASR02║ Consulta rápida de disponibilidad    ║  100  ║   XXX.X    ║  ✅ PASS ║
    ╚══════╩══════════════════════════════════════╩═══════╩════════════╩══════════╝
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from conftest import setup, percentile  # noqa: E402
import asr01_buscar_hoteles          as asr01  # noqa: E402
import asr02_disponibilidad_hotel    as asr02  # noqa: E402


def main():
    print("=" * 70)
    print("  EVIDENCIA ASR SPRINT 1 — TravelHub")
    print(f"  Fecha de ejecución: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    print()
    print("  Nota: ASR03 y ASR04 reutilizan evidencia del Sprint 2.")
    print("        ASR16 es validación funcional (inspección de código).")
    print("        Este script ejecuta únicamente los ASRs nuevos del Sprint 1:")
    print("        ASR01 (búsqueda) y ASR02 (disponibilidad).")
    print()

    # Un único login / setup compartido para todos los scripts
    ctx = setup(verbose=True)

    # Ejecutar benchmarks en orden -------------------------------------------
    results = []
    for mod in (asr01, asr02):
        result = mod.run_benchmark(ctx)
        results.append(result)

    # Tabla resumen ------------------------------------------------------------
    print("\n")
    print("=" * 70)
    print("  RESUMEN EJECUTIVO — Sprint 1 (ASRs nuevos)")
    print("=" * 70)

    header = f"{'ASR':<8} {'Escenario':<40} {'n':>5}  {'Métrica':>8}  {'Valor(ms)':>10}  {'Umbral':>10}  {'Veredicto'}"
    sep    = "-" * 90
    print(header)
    print(sep)

    all_passed = True
    for r in results:
        metric = r.get("metric", "p95")
        if r["latencies"]:
            p_val = percentile(sorted(r["latencies"]), 99 if metric == "p99" else 95)
        else:
            p_val = float("inf")

        verdict    = "✅ PASS" if r["passed"] else "❌ FAIL"
        all_passed = all_passed and r["passed"]

        print(
            f"{r['asr']:<8} {r['name']:<40} {r['n']:>5}  {metric:>8}  {p_val:>10.1f}  "
            f"{r['threshold']:>10.0f}  {verdict}"
        )

    print(sep)
    overall = "✅ TODOS LOS ASRs CUMPLEN" if all_passed else "❌ HAY ASRs QUE NO CUMPLEN"
    print(f"\n  RESULTADO GLOBAL: {overall}\n")
    print("  Copiar esta tabla en docs/EVIDENCIA_ASR_SPRINT1.md")
    print("=" * 70)

    # Guardar salida también en archivo de texto
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
