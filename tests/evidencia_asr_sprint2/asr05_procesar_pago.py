"""
ASR05 — Procesamiento ágil de pagos
Umbral: p95 ≤ 3 000 ms

Por cada una de las 30 iteraciones:
  1. [NO medido] POST /reservas  → obtiene payment_id del response
  2. [MEDIDO]    POST /payments/{payment_id}/process

El tiempo medido es únicamente el del paso 2 (procesamiento del pago),
que incluye la llamada al servicio externo de pagos (ext-payments en AWS).

Las reservas de prueba se eliminan al finalizar (cleanup).

Uso:
    python asr05_procesar_pago.py
"""

import sys
import os
import time
import requests

sys.path.insert(0, os.path.dirname(__file__))
from conftest import (  # noqa: E402
    setup,
    BASE_URL,
    PAGO_DATE_OFFSET,
    print_stats,
    reserva_dates,
    delete_reserva,
)

# ---------------------------------------------------------------------------
# Parámetros del benchmark
# ---------------------------------------------------------------------------
N_LLAMADAS  = 30
UMBRAL_P95  = 3000.0  # ms
ASR_CODE    = "ASR05"
ASR_NAME    = "Procesamiento ágil de pagos"


# ---------------------------------------------------------------------------
# Función de benchmark
# ---------------------------------------------------------------------------

def run_benchmark(ctx: dict | None = None) -> dict:
    """Ejecuta el benchmark ASR05 y retorna el resumen de resultados."""
    if ctx is None:
        ctx = setup()

    headers       = ctx["headers"]
    user_id       = ctx["user_id"]
    habitacion_id = ctx["habitacion_id"]
    pais_id       = ctx["pais_id"]
    estado_id     = ctx["estado_id"]

    print(f"\n[{ASR_CODE}] Iniciando: {N_LLAMADAS} iteraciones de procesamiento de pago …")
    print(f"  Base de fechas: today + {PAGO_DATE_OFFSET} dias (rango separado de ASR04)")
    print(f"  Paso 1 (no medido): POST /hold + POST /reservas")
    print(f"  Paso 2 (MEDIDO):    POST /payments/{{id}}/process")

    latencies_ms  = []
    errors        = 0
    pricing_skips = 0
    created_ids   = []

    for i in range(N_LLAMADAS):
        fecha_ingreso, fecha_salida = reserva_dates(i, PAGO_DATE_OFFSET)

        hold_payload = {
            "id_usuario":    user_id,
            "fecha_ingreso": fecha_ingreso,
            "fecha_salida":  fecha_salida,
        }
        reserva_payload = {
            "fecha_ingreso":  fecha_ingreso,
            "fecha_salida":   fecha_salida,
            "nro_personas":   1,
            "id_usuario":     user_id,
            "id_pais":        pais_id,
            "id_habitacion":  habitacion_id,
            "id_estado":      estado_id,
            "payment_method": "card",
        }

        # --- Paso 1a: adquirir hold (sin medir) -------------------------------
        try:
            r_hold = requests.post(
                f"{BASE_URL}/habitaciones/{habitacion_id}/hold",
                json=hold_payload,
                headers=headers,
                timeout=15,
            )
            if r_hold.status_code not in (200, 201):
                errors += 1
                print(f"  [WARN] iter {i+1}: POST /hold -> HTTP {r_hold.status_code}")
                continue
        except requests.RequestException as exc:
            errors += 1
            print(f"  [ERR]  iter {i+1}: POST /hold fallo — {exc}")
            continue

        # --- Paso 1b: crear reserva (sin medir) -------------------------------
        try:
            r_res = requests.post(
                f"{BASE_URL}/reservas",
                json=reserva_payload,
                headers=headers,
                timeout=20,
            )
        except requests.RequestException as exc:
            errors += 1
            print(f"  [ERR]  iter {i+1}: POST /reservas fallo — {exc}")
            continue

        if r_res.status_code == 422:
            pricing_skips += 1
            continue
        if r_res.status_code != 201:
            errors += 1
            print(f"  [WARN] iter {i+1}: POST /reservas -> HTTP {r_res.status_code}")
            continue

        reserva_data = r_res.json()
        reserva_id   = reserva_data.get("id")
        # payment_id is nested: response["payment"]["payment_id"]
        payment_info = reserva_data.get("payment") or {}
        payment_id   = payment_info.get("payment_id")

        if reserva_id:
            created_ids.append(reserva_id)

        if not payment_id:
            errors += 1
            print(
                f"  [WARN] iter {i+1}: reserva creada sin payment_id "
                f"(payment={payment_info!r})."
            )
            continue

        # --- Paso 2: procesar el pago (MEDIDO) --------------------------------
        t0 = time.perf_counter()
        try:
            r_pay = requests.post(
                f"{BASE_URL}/payments/{payment_id}/process",
                json={},
                headers=headers,
                timeout=15,
            )
            elapsed = (time.perf_counter() - t0) * 1000.0

            if r_pay.status_code == 200:
                latencies_ms.append(elapsed)
            else:
                errors += 1
                print(
                    f"  [WARN] iter {i+1}: POST /payments/process → "
                    f"HTTP {r_pay.status_code} — {r_pay.text[:120]}"
                )

        except requests.RequestException as exc:
            elapsed = (time.perf_counter() - t0) * 1000.0
            errors += 1
            print(f"  [ERR]  iter {i+1}: POST /payments/process falló — {exc}")

    # Cleanup: eliminar reservas de prueba ------------------------------------
    print(f"  Limpiando {len(created_ids)} reservas de prueba …")
    cleanup_ok = 0
    for rid in created_ids:
        if delete_reserva(rid, headers):
            cleanup_ok += 1
    print(f"  Reservas eliminadas: {cleanup_ok}/{len(created_ids)}")

    if pricing_skips:
        print(f"  [INFO] {pricing_skips} iteraciones omitidas por 422 (sin regla tarifaria).")
        print("         Ajustar PAGO_DATE_OFFSET en conftest.py si es necesario.")
    if errors:
        print(f"  Errores inesperados: {errors}")

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
