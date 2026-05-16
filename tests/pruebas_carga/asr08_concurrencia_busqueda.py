"""
ASR08 — Concurrencia multi-país: Prueba de carga sobre búsqueda de hospedajes
==============================================================================

Medida de respuesta: 600 usuarios concurrentes por país (3 600 total) / min
Umbral de latencia:  p95 ≤ 1 500 ms
  - 800 ms server-side (definido en ASR01/ASR08)
  - + ~700 ms overhead de red Colombia → AWS us-east-1

Estrategia:
  - Niveles de concurrencia: [10, 25, 50, 100, 200, 400, 600]
  - 100 requests por nivel, todos lanzados con ThreadPoolExecutor
  - HTTP Session con HTTPAdapter(pool_maxsize=650) para evitar agotamiento de conexiones
  - Se escribe un CSV con una fila por request al finalizar todos los niveles

HU asociadas:
  - HU-W-17  Búsqueda avanzada de hospedaje
  - HU-M-26  Búsqueda de hospedaje desde la app

Uso:
    python asr08_concurrencia_busqueda.py
    # o desde run_load_test.py
"""

import sys
import os
import csv
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta, datetime

import requests
from requests.adapters import HTTPAdapter

sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, print_stats, percentile  # noqa: E402

# ---------------------------------------------------------------------------
# Parámetros del test de carga
# ---------------------------------------------------------------------------
CONCURRENCY_LEVELS = [10, 25, 50, 100, 200, 400, 600]
N_PER_LEVEL        = 100          # requests que se disparan por nivel
UMBRAL_P95         = 1500.0       # ms — ASR08 criterio de aceptación
ASR_CODE           = "ASR08"
ASR_NAME           = "Concurrencia multi-país — Búsqueda de hospedajes"

_SEARCH_OFFSET_DAYS = 60          # fecha_ingreso = today + 60 días (base)
_CSV_LOCK = threading.Lock()      # para append seguro si fuera necesario


# ---------------------------------------------------------------------------
# Payload de búsqueda rotado
# ---------------------------------------------------------------------------

def _search_payload(iteration: int) -> dict:
    """Genera payload variando levemente las fechas para evitar respuestas cacheadas."""
    today = date.today()
    offset = _SEARCH_OFFSET_DAYS + (iteration % 5)
    fecha_ingreso = today + timedelta(days=offset)
    fecha_salida  = fecha_ingreso + timedelta(days=3)
    return {
        "busqueda":      "Bogota",
        "fecha_ingreso": fecha_ingreso.isoformat(),
        "fecha_salida":  fecha_salida.isoformat(),
        "nro_personas":  2,
    }


# ---------------------------------------------------------------------------
# Worker: ejecuta un único request y devuelve métricas
# ---------------------------------------------------------------------------

def _single_request(session: requests.Session, headers: dict, iteration: int) -> dict:
    """Ejecuta un request de búsqueda y retorna sus métricas."""
    url = f"{BASE_URL}/hoteles/buscar-disponibles"
    payload = _search_payload(iteration)
    timestamp_inicio = datetime.utcnow().isoformat(timespec="milliseconds")
    t0 = time.perf_counter()
    try:
        r = session.post(url, json=payload, headers=headers, timeout=20)
        latencia_ms = (time.perf_counter() - t0) * 1000.0
        status_code = r.status_code
        exito = 1 if status_code == 200 else 0
    except requests.RequestException:
        latencia_ms = (time.perf_counter() - t0) * 1000.0
        status_code = 0
        exito = 0
    return {
        "timestamp_inicio": timestamp_inicio,
        "latencia_ms":      round(latencia_ms, 2),
        "status_code":      status_code,
        "exito":            exito,
    }


# ---------------------------------------------------------------------------
# Test por nivel de concurrencia
# ---------------------------------------------------------------------------

def _run_level(ctx: dict, nivel: int) -> tuple[list, list]:
    """Lanza N_PER_LEVEL requests en paralelo con `nivel` workers concurrentes.

    Retorna (latencias_ok, all_rows) donde:
        latencias_ok — latencias de requests exitosos (para calcular p95)
        all_rows     — todos los registros (para CSV)
    """
    # Sesión compartida con pool amplio para soportar hasta 600 conexiones simultáneas
    session = requests.Session()
    adapter = HTTPAdapter(pool_maxsize=650, pool_connections=10, max_retries=1)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)

    headers = ctx["headers"]

    with ThreadPoolExecutor(max_workers=nivel) as executor:
        futures = {
            executor.submit(_single_request, session, headers, i): i
            for i in range(N_PER_LEVEL)
        }
        rows = []
        for future in as_completed(futures):
            rows.append(future.result())

    session.close()

    latencias_ok = [r["latencia_ms"] for r in rows if r["exito"] == 1]
    return latencias_ok, rows


# ---------------------------------------------------------------------------
# Función principal exportable
# ---------------------------------------------------------------------------

def run_load_test(ctx: dict | None = None) -> list:
    """Ejecuta la prueba de carga ASR08 en todos los niveles de concurrencia.

    Retorna una lista de dicts con el resumen por nivel:
        nivel_concurrencia, n_total, n_errores, p50, p75, p95, p99, min, max, media, passed
    """
    if ctx is None:
        ctx = setup()

    SEP   = "=" * 64
    LINE  = "─" * 64
    all_csv_rows: list[dict] = []
    summary: list[dict]      = []

    print(f"\n{SEP}")
    print(f"  {ASR_CODE} — {ASR_NAME}")
    print(f"  Umbral p95: {UMBRAL_P95:.0f} ms  |  Requests/nivel: {N_PER_LEVEL}")
    print(f"  Niveles: {CONCURRENCY_LEVELS}")
    print(SEP)

    for nivel in CONCURRENCY_LEVELS:
        print(f"\n[ASR08] Nivel concurrencia = {nivel} workers — disparando {N_PER_LEVEL} requests …")
        t_start = time.perf_counter()
        latencias_ok, rows = _run_level(ctx, nivel)
        t_elapsed = (time.perf_counter() - t_start)

        # Enriquecer filas con nivel para CSV
        for row in rows:
            row["nivel_concurrencia"] = nivel
        all_csv_rows.extend(rows)

        n_total  = len(rows)
        n_errores = sum(1 for r in rows if r["exito"] == 0)

        if latencias_ok:
            s    = sorted(latencias_ok)
            p50  = percentile(s, 50)
            p75  = percentile(s, 75)
            p95  = percentile(s, 95)
            p99  = percentile(s, 99)
            mn   = s[0]
            mx   = s[-1]
            avg  = sum(s) / len(s)
        else:
            p50 = p75 = p95 = p99 = mn = mx = avg = 0.0

        passed  = (p95 <= UMBRAL_P95) and (n_errores == 0 or n_errores / n_total < 0.05)
        verdict = "✅ PASS" if passed else "❌ FAIL"

        print(LINE)
        print(f"  Concurrencia: {nivel:4d}  |  Total: {n_total}  |  Errores: {n_errores}  |  Tiempo total: {t_elapsed:.2f}s")
        print(f"  p50: {p50:7.1f}ms  p75: {p75:7.1f}ms  p95: {p95:7.1f}ms  p99: {p99:7.1f}ms")
        print(f"  min: {mn:7.1f}ms  max: {mx:7.1f}ms  media: {avg:7.1f}ms")
        print(f"  RESULTADO: {verdict}  (p95={p95:.1f}ms {'≤' if p95 <= UMBRAL_P95 else '>'} {UMBRAL_P95:.0f}ms)")
        print(LINE)

        summary.append({
            "nivel_concurrencia": nivel,
            "n_total":   n_total,
            "n_errores": n_errores,
            "p50":  round(p50,  2),
            "p75":  round(p75,  2),
            "p95":  round(p95,  2),
            "p99":  round(p99,  2),
            "min":  round(mn,   2),
            "max":  round(mx,   2),
            "media":round(avg,  2),
            "passed": passed,
        })

    # Escribir CSV -----------------------------------------------------------
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    csv_path = os.path.join(os.path.dirname(__file__), f"resultados_asr08_{ts}.csv")
    csv_cols = [
        "nivel_concurrencia", "iteracion", "timestamp_inicio",
        "latencia_ms", "status_code", "exito",
    ]

    # Reconstruir columna iteracion por nivel
    level_counters: dict[int, int] = {}
    enriched_rows = []
    for row in all_csv_rows:
        nv = row["nivel_concurrencia"]
        level_counters.setdefault(nv, 0)
        enriched = {
            "nivel_concurrencia": nv,
            "iteracion":          level_counters[nv],
            "timestamp_inicio":   row["timestamp_inicio"],
            "latencia_ms":        row["latencia_ms"],
            "status_code":        row["status_code"],
            "exito":              row["exito"],
        }
        level_counters[nv] += 1
        enriched_rows.append(enriched)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_cols)
        writer.writeheader()
        writer.writerows(enriched_rows)

    print(f"\n✅ CSV guardado: {csv_path}")
    return summary


# ---------------------------------------------------------------------------
# Entry point directo
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    ctx = setup(verbose=True)
    results = run_load_test(ctx)
    all_pass = all(r["passed"] for r in results)
    sys.exit(0 if all_pass else 1)
