"""
ASR04 — Creación rápida de una reserva
Umbral ASR:    p95 ≤ 1 500 ms (server-side)
Umbral medido: p95 ≤ 2 500 ms (+1 000 ms overhead de red cliente->AWS us-east-1)

Flujo medido end-to-end por iteración:
  1. POST /habitaciones/{id}/hold  — adquiere hold temporal (requerido por API)
  2. POST /reservas                — crea la reserva (libera hold automáticamente)

Cada iteración usa un rango de 2 noches distinto con stride de 3 días,
comenzando en today + BASE_DATE_OFFSET días.

Uso:
    python asr04_crear_reserva.py
"""

import sys
import os
import time
import requests

sys.path.insert(0, os.path.dirname(__file__))
from conftest import (  # noqa: E402
    setup,
    BASE_URL,
    BASE_DATE_OFFSET,
    print_stats,
    reserva_dates,
    delete_reserva,
)

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS   = 50
UMBRAL_P95   = 2500.0  # ms — ASR define 1500ms server-side; +1000ms overhead de red cliente→AWS us-east-1
ASR_CODE     = "ASR04"
ASR_NAME     = "Creación rápida de una reserva"


# ---------------------------------------------------------------------------
# Función de benchmark
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR04 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    headers       = ctx["headers"]
    user_id       = ctx["user_id"]
    habitacion_id = ctx["habitacion_id"]
    pais_id       = ctx["pais_id"]
    estado_id     = ctx["estado_id"]

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} iteraciones (hold + reserva) …")
    print(f"  Base de fechas: today + {BASE_DATE_OFFSET} dias, stride 3 dias/iter")
    print(f"  Flujo medido: POST /hold + POST /reservas (end-to-end)")

    latencies_ms  = []
    errors        = 0
    pricing_skips = 0
    created_ids   = []

    for i in range(N_LLAMADAS):
        fecha_ingreso, fecha_salida = reserva_dates(i, BASE_DATE_OFFSET)

        hold_payload = {
            "id_usuario":   user_id,
            "fecha_ingreso": fecha_ingreso,
            "fecha_salida":  fecha_salida,
        }
        reserva_payload = {
            "fecha_ingreso":  fecha_ingreso,
            "fecha_salida":   fecha_salida,
            "nro_personas":   2,
            "id_usuario":     user_id,
            "id_pais":        pais_id,
            "id_habitacion":  habitacion_id,
            "id_estado":      estado_id,
            "payment_method": "card",
        }

        # Medir el flujo completo: hold + reserva
        t0 = time.perf_counter()
        try:
            # Paso 1: adquirir hold
            r_hold = requests.post(
                f"{BASE_URL}/habitaciones/{habitacion_id}/hold",
                json=hold_payload,
                headers=headers,
                timeout=15,
            )
            if r_hold.status_code not in (200, 201):
                elapsed = (time.perf_counter() - t0) * 1000.0
                errors += 1
                print(f"  [WARN] iter {i+1}: POST /hold -> HTTP {r_hold.status_code} — {r_hold.text[:120]}")
                continue

            # Paso 2: crear reserva (hold se libera automáticamente)
            r = requests.post(
                f"{BASE_URL}/reservas",
                json=reserva_payload,
                headers=headers,
                timeout=15,
            )
            elapsed = (time.perf_counter() - t0) * 1000.0

            if r.status_code == 201:
                latencies_ms.append(elapsed)
                reserva_id = r.json().get("id")
                if reserva_id:
                    created_ids.append(reserva_id)
            elif r.status_code == 422:
                pricing_skips += 1
            else:
                errors += 1
                print(f"  [WARN] iter {i+1}: POST /reservas -> HTTP {r.status_code} — {r.text[:120]}")

        except requests.RequestException as exc:
            errors += 1
            print(f"  [ERR]  iter {i+1}: {exc}")

    # Cleanup: eliminar reservas de prueba -----------------------------------
    print(f"  Limpiando {len(created_ids)} reservas de prueba …")
    cleanup_ok = 0
    for rid in created_ids:
        if delete_reserva(rid, headers):
            cleanup_ok += 1
    print(f"  Reservas eliminadas: {cleanup_ok}/{len(created_ids)}")

    if pricing_skips:
        print(f"  [INFO] {pricing_skips} iteraciones omitidas por 422 (sin regla tarifaria).")
        print("         Ajustar BASE_DATE_OFFSET en conftest.py si es necesario.")
    if errors:
        print(f"  Errores HTTP inesperados: {errors}")

    passed = print_stats(ASR_CODE, ASR_NAME, latencies_ms, UMBRAL_P95)

    return {
        "asr":           ASR_CODE,
        "name":          ASR_NAME,
        "n":             len(latencies_ms),
        "errors":        errors,
        "pricing_skips": pricing_skips,
        "threshold":     UMBRAL_P95,
        "passed":        passed,
        "latencies":     latencies_ms,
    }


# ---------------------------------------------------------------------------
# Punto de entrada standalone
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_benchmark()
