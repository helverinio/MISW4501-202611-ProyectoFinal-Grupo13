"""
ASR08 -- Concurrencia multi-pais: Prueba de carga sobre GET /holds/<hold_id> (Redis)
======================================================================================

Estrategia:
  - Setup: crear 1 hold via POST /habitaciones/{id}/hold -> obtener hold_id
  - Load test: N workers concurrentes sobre GET /holds/{hold_id}
    -> cache hit en Redis -> 0 queries a BD -> latencia dominada por red (~700ms)
  - Niveles: [10, 25, 50, 100, 200, 400, 600]
  - 100 requests por nivel, Umbral p95 <= 1500 ms

Cache hit path (room_holds.py linea ~148):
    cached_hold = lock_service.get_cached_room_hold_by_id(hold_id)
    if cached_hold:
        cached_hold['is_active'] = True
        return jsonify(cached_hold)   # <- Redis puro, 0 DB queries

HU asociadas:
  - HU-W-19  Creacion de reservas (carrito con hold temporal)
  - TFP-15.1 Carrito de reserva con hold temporal

Uso:
    python asr08_concurrencia_holds.py
    # o desde run_load_test_holds.py
"""

import sys
import os
import csv
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta, datetime

import requests
from requests.adapters import HTTPAdapter

sys.path.insert(0, os.path.dirname(__file__))
from conftest import setup, BASE_URL, percentile  # noqa: E402

# ---------------------------------------------------------------------------
# Parametros
# ---------------------------------------------------------------------------
CONCURRENCY_LEVELS = [10, 25, 50, 100, 200, 400, 600]
N_PER_LEVEL        = 100
UMBRAL_P95         = 1500.0
ASR_CODE           = "ASR08"
ASR_NAME           = "Concurrencia multi-pais -- GET /holds (Redis cache)"

# Fechas del hold de prueba: suficientemente futuras para evitar conflictos
_HOLD_OFFSET_DAYS = 120   # today + 120 dias


# ---------------------------------------------------------------------------
# Crear hold de prueba
# ---------------------------------------------------------------------------

def create_test_hold(ctx: dict) -> str:
    """Crea un hold via POST /habitaciones/{id}/hold y retorna su hold_id.

    El hold tiene TTL de 15 minutos. La prueba completa dura ~5 min,
    por lo que el hold permanece activo en Redis durante toda la ejecucion,
    garantizando cache hits en todos los requests.
    """
    headers       = ctx["headers"]
    habitacion_id = ctx["habitacion_id"]
    user_id       = ctx["user_id"]

    today = date.today()
    fecha_ingreso = (today + timedelta(days=_HOLD_OFFSET_DAYS)).isoformat()
    fecha_salida  = (today + timedelta(days=_HOLD_OFFSET_DAYS + 3)).isoformat()

    url = f"{BASE_URL}/habitaciones/{habitacion_id}/hold"
    payload = {
        "id_usuario":    user_id,
        "fecha_ingreso": fecha_ingreso,
        "fecha_salida":  fecha_salida,
    }

    print(f"\n[SETUP] Creando hold de prueba en habitacion {habitacion_id} ...")
    print(f"  Fechas: {fecha_ingreso} -> {fecha_salida}")

    r = requests.post(url, json=payload, headers=headers, timeout=30)

    # 201 = creado nuevo; 200 = ya existia (idempotente) -- ambos validos
    if r.status_code not in (200, 201):
        raise RuntimeError(
            f"No se pudo crear el hold de prueba: HTTP {r.status_code} -- {r.text[:200]}"
        )

    hold_data  = r.json()
    hold_id    = hold_data["id"]
    expires_at = hold_data.get("expires_at", "?")
    print(f"  OK Hold creado  | id = {hold_id}")
    print(f"  OK Expira en    | {expires_at}")
    return hold_id


# ---------------------------------------------------------------------------
# Worker: GET /holds/{hold_id}
# ---------------------------------------------------------------------------

def _single_request(session: requests.Session, headers: dict, hold_id: str) -> dict:
    """Consulta el hold -- esperado: cache hit en Redis, sin query a BD."""
    url = f"{BASE_URL}/holds/{hold_id}"
    timestamp_inicio = datetime.utcnow().isoformat(timespec="milliseconds")
    t0 = time.perf_counter()
    try:
        r = session.get(url, headers=headers, timeout=20)
        latencia_ms = (time.perf_counter() - t0) * 1000.0
        status_code = r.status_code
        exito = 1 if status_code == 200 else 0
        try:
            body      = r.json()
            # is_active=True es inyectado por el servidor solo en el path de cache hit
            cache_hit = 1 if (exito and body.get("is_active") is True) else 0
        except Exception:
            cache_hit = 0
    except requests.RequestException:
        latencia_ms = (time.perf_counter() - t0) * 1000.0
        status_code = 0
        exito       = 0
        cache_hit   = 0
    return {
        "timestamp_inicio": timestamp_inicio,
        "latencia_ms":      round(latencia_ms, 2),
        "status_code":      status_code,
        "exito":            exito,
        "cache_hit":        cache_hit,
    }


# ---------------------------------------------------------------------------
# Test por nivel
# ---------------------------------------------------------------------------

def _run_level(ctx: dict, hold_id: str, nivel: int):
    session = requests.Session()
    adapter = HTTPAdapter(pool_maxsize=650, pool_connections=10, max_retries=1)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)
    headers = ctx["headers"]

    with ThreadPoolExecutor(max_workers=nivel) as executor:
        futures = [
            executor.submit(_single_request, session, headers, hold_id)
            for _ in range(N_PER_LEVEL)
        ]
        rows = [f.result() for f in futures]

    session.close()
    latencias_ok = [row["latencia_ms"] for row in rows if row["exito"] == 1]
    return latencias_ok, rows


# ---------------------------------------------------------------------------
# Funcion principal exportable
# ---------------------------------------------------------------------------

def run_load_test(ctx=None, hold_id=None) -> list:
    """Ejecuta la prueba de carga ASR08 (Redis) en todos los niveles.

    Retorna lista de dicts con resumen por nivel.
    """
    if ctx is None:
        ctx = setup()
    if hold_id is None:
        hold_id = create_test_hold(ctx)

    SEP  = "=" * 64
    LINE = "-" * 64
    all_csv_rows = []
    summary      = []

    print(f"\n{SEP}")
    print(f"  {ASR_CODE} -- {ASR_NAME}")
    print(f"  Hold ID   : {hold_id}")
    print(f"  Umbral p95: {UMBRAL_P95:.0f} ms  |  Requests/nivel: {N_PER_LEVEL}")
    print(f"  Niveles   : {CONCURRENCY_LEVELS}")
    print(SEP)

    for nivel in CONCURRENCY_LEVELS:
        print(f"\n[ASR08] Nivel concurrencia = {nivel} workers -- disparando {N_PER_LEVEL} requests ...")
        t_start = time.perf_counter()
        latencias_ok, rows = _run_level(ctx, hold_id, nivel)
        t_elapsed = time.perf_counter() - t_start

        for row in rows:
            row["nivel_concurrencia"] = nivel
        all_csv_rows.extend(rows)

        n_total   = len(rows)
        n_errores = sum(1 for row in rows if row["exito"] == 0)
        n_hits    = sum(1 for row in rows if row["cache_hit"] == 1)

        if latencias_ok:
            s   = sorted(latencias_ok)
            p50 = percentile(s, 50)
            p75 = percentile(s, 75)
            p95 = percentile(s, 95)
            p99 = percentile(s, 99)
            mn  = s[0]
            mx  = s[-1]
            avg = sum(s) / len(s)
        else:
            p50 = p75 = p95 = p99 = mn = mx = avg = 0.0

        passed  = (p95 <= UMBRAL_P95) and (n_errores / n_total < 0.05)
        verdict = "PASS" if passed else "FAIL"

        print(LINE)
        print(
            f"  Concurrencia: {nivel:4d}  |  Total: {n_total}  |"
            f"  Errores: {n_errores}  |  Cache hits: {n_hits}  |  Tiempo: {t_elapsed:.2f}s"
        )
        print(f"  p50: {p50:7.1f}ms  p75: {p75:7.1f}ms  p95: {p95:7.1f}ms  p99: {p99:7.1f}ms")
        print(f"  min: {mn:7.1f}ms  max: {mx:7.1f}ms  media: {avg:7.1f}ms")
        print(f"  RESULTADO: {verdict}  (p95={p95:.1f}ms {'<=' if p95 <= UMBRAL_P95 else '>'} {UMBRAL_P95:.0f}ms)")
        print(LINE)

        summary.append({
            "nivel_concurrencia": nivel,
            "n_total":   n_total,
            "n_errores": n_errores,
            "n_hits":    n_hits,
            "p50":  round(p50,  2),
            "p75":  round(p75,  2),
            "p95":  round(p95,  2),
            "p99":  round(p99,  2),
            "min":  round(mn,   2),
            "max":  round(mx,   2),
            "media":round(avg,  2),
            "passed": passed,
        })

    # CSV ---------------------------------------------------------------------
    ts       = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    csv_path = os.path.join(
        os.path.dirname(__file__), f"resultados_asr08_redis_{ts}.csv"
    )
    csv_cols = [
        "nivel_concurrencia", "iteracion", "timestamp_inicio",
        "latencia_ms", "status_code", "exito", "cache_hit",
    ]

    level_counters: dict = {}
    enriched = []
    for row in all_csv_rows:
        nv = row["nivel_concurrencia"]
        level_counters.setdefault(nv, 0)
        enriched.append({
            "nivel_concurrencia": nv,
            "iteracion":          level_counters[nv],
            "timestamp_inicio":   row["timestamp_inicio"],
            "latencia_ms":        row["latencia_ms"],
            "status_code":        row["status_code"],
            "exito":              row["exito"],
            "cache_hit":          row["cache_hit"],
        })
        level_counters[nv] += 1

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_cols)
        writer.writeheader()
        writer.writerows(enriched)

    print(f"\nCSV guardado: {csv_path}")
    return summary


# ---------------------------------------------------------------------------
# Entry point directo
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    ctx     = setup(verbose=True)
    hold_id = create_test_hold(ctx)
    results = run_load_test(ctx, hold_id)
    sys.exit(0 if all(r["passed"] for r in results) else 1)
