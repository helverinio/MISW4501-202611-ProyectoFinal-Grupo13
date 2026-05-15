"""
Contexto compartido para los scripts de benchmark ASR Sprint 3.

Autentica contra producción, descubre los IDs reales de recursos
(hotel, habitación, país, estado) y provee utilidades comunes.

Idéntico al conftest de Sprint 1 y Sprint 2.

Uso:
    from conftest import setup, BASE_URL, print_stats, print_stats_p99
    ctx = setup()   # llama sólo una vez; las siguientes llamadas devuelven caché
"""

import sys
import os
import math
import requests
from datetime import date, timedelta

# Force UTF-8 output so Unicode symbols work on Windows cp1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Configuración de producción
# ---------------------------------------------------------------------------
BASE_URL = "https://d1r8df79ch2otn.cloudfront.net/api/v1"
CREDENTIALS = {"usuario": "jperez", "contrasena": "SecurePassword123!"}

# Offset en días desde hoy para las fechas de prueba.
# Ajustar si las reglas tarifarias no cubren este rango.
BASE_DATE_OFFSET = 90   # reservas ASR04 empiezan en today+90

# ---------------------------------------------------------------------------
# Caché de contexto
# ---------------------------------------------------------------------------
_ctx = None


# ---------------------------------------------------------------------------
# Utilidades de estadística (sin dependencias externas)
# ---------------------------------------------------------------------------

def percentile(sorted_data: list, p: float) -> float:
    """Percentil p (0-100) usando método 'nearest rank' sobre datos ya ordenados."""
    if not sorted_data:
        return 0.0
    idx = max(0, math.ceil(len(sorted_data) * p / 100.0) - 1)
    return sorted_data[idx]


def print_stats(asr_code: str, name: str, latencies_ms: list, threshold_ms: float):
    """Imprime la tabla de resultados estándar para un ASR (criterio: p95)."""
    if not latencies_ms:
        print(f"\n{asr_code} - {name}")
        print("  [ERROR] Sin muestras válidas.")
        return False

    s = sorted(latencies_ms)
    p50 = percentile(s, 50)
    p75 = percentile(s, 75)
    p95 = percentile(s, 95)
    p99 = percentile(s, 99)
    mn  = s[0]
    mx  = s[-1]
    avg = sum(s) / len(s)
    passed = p95 <= threshold_ms

    line = "─" * 52
    print(f"\n{asr_code} - {name}")
    print(f"Llamadas: {len(s)}  |  Umbral p95: {threshold_ms:.0f}ms")
    print(line)
    print(f"p50: {p50:7.1f}ms   p75: {p75:7.1f}ms   p95: {p95:7.1f}ms   p99: {p99:7.1f}ms")
    print(f"min: {mn:7.1f}ms   max: {mx:7.1f}ms   media: {avg:7.1f}ms")
    print(line)
    verdict = "✅ PASS" if passed else "❌ FAIL"
    print(f"RESULTADO: {verdict}  (p95={p95:.1f}ms {'≤' if passed else '>'} {threshold_ms:.0f}ms)")
    return passed


def print_stats_p99(asr_code: str, name: str, latencies_ms: list, threshold_ms: float):
    """Imprime la tabla de resultados estándar para un ASR con criterio p99.

    Usado por ASR02 cuya medida de respuesta es p99 ≤ 200 ms (server-side).
    """
    if not latencies_ms:
        print(f"\n{asr_code} - {name}")
        print("  [ERROR] Sin muestras válidas.")
        return False

    s = sorted(latencies_ms)
    p50 = percentile(s, 50)
    p75 = percentile(s, 75)
    p95 = percentile(s, 95)
    p99 = percentile(s, 99)
    mn  = s[0]
    mx  = s[-1]
    avg = sum(s) / len(s)
    passed = p99 <= threshold_ms

    line = "─" * 52
    print(f"\n{asr_code} - {name}")
    print(f"Llamadas: {len(s)}  |  Umbral p99: {threshold_ms:.0f}ms")
    print(line)
    print(f"p50: {p50:7.1f}ms   p75: {p75:7.1f}ms   p95: {p95:7.1f}ms   p99: {p99:7.1f}ms")
    print(f"min: {mn:7.1f}ms   max: {mx:7.1f}ms   media: {avg:7.1f}ms")
    print(line)
    verdict = "✅ PASS" if passed else "❌ FAIL"
    print(f"RESULTADO: {verdict}  (p99={p99:.1f}ms {'≤' if passed else '>'} {threshold_ms:.0f}ms)")
    return passed


# ---------------------------------------------------------------------------
# Setup de producción
# ---------------------------------------------------------------------------

def setup(verbose: bool = True) -> dict:
    """Autentica y descubre los IDs de recursos en producción.

    Retorna un dict con:
        token         — JWT Bearer token
        user_id       — ID del usuario jperez
        hotel_id      — ID del primer hotel disponible
        habitacion_id — ID de la primera habitación del hotel
        pais_id       — ID del primer país disponible
        estado_id     — ID del estado «Pendiente» (o primero si no existe)
        headers       — dict listo para pasar como headers en requests
    """
    global _ctx
    if _ctx is not None:
        return _ctx

    SEP = "=" * 56
    print(SEP)
    print("  SETUP — Autenticando contra producción AWS")
    print(SEP)

    # 1. Login -----------------------------------------------------------------
    try:
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json=CREDENTIALS,
            timeout=30,
        )
        r.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Login fallido: {exc}") from exc

    login_data = r.json()
    token   = login_data["access_token"]
    user_id = login_data["usuario"]["id"]
    if verbose:
        print(f"  ✓ Login       | user_id = {user_id}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Hoteles ---------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/hoteles", headers=headers, timeout=30)
    r.raise_for_status()
    hoteles = r.json()
    if not hoteles:
        raise RuntimeError("No se encontraron hoteles en producción.")
    hotel    = hoteles[0]
    hotel_id = hotel["id"]
    if verbose:
        print(f"  ✓ Hotel       | id = {hotel_id}  nombre = {hotel.get('nombre', '?')}")

    # 3. Habitaciones del hotel ------------------------------------------------
    r = requests.get(
        f"{BASE_URL}/hoteles/{hotel_id}/habitaciones",
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    habitaciones = r.json()
    if not habitaciones:
        raise RuntimeError(f"Hotel {hotel_id} sin habitaciones.")
    hab           = habitaciones[0]
    habitacion_id = hab["id"]
    if verbose:
        print(f"  ✓ Habitación  | id = {habitacion_id}  tipo = {hab.get('tipo', '?')}")

    # 4. Países ----------------------------------------------------------------
    r = requests.get(f"{BASE_URL}/paises", headers=headers, timeout=30)
    r.raise_for_status()
    paises = r.json()
    if not paises:
        raise RuntimeError("No se encontraron países en producción.")
    pais_id = paises[0]["id"]
    if verbose:
        print(f"  ✓ País        | id = {pais_id}  nombre = {paises[0].get('nombre', '?')}")

    # 5. Estado «Pendiente» ----------------------------------------------------
    r = requests.get(f"{BASE_URL}/estados", headers=headers, timeout=30)
    r.raise_for_status()
    estados = r.json()
    if not estados:
        raise RuntimeError("No se encontraron estados en producción.")
    estado_obj = next(
        (e for e in estados if "pendiente" in e.get("nombre", "").lower()),
        estados[0],
    )
    estado_id = estado_obj["id"]
    if verbose:
        print(f"  ✓ Estado      | id = {estado_id}  nombre = {estado_obj.get('nombre', '?')}")

    print(f"  Setup completado.\n")

    _ctx = {
        "token":         token,
        "user_id":       user_id,
        "hotel_id":      hotel_id,
        "habitacion_id": habitacion_id,
        "pais_id":       pais_id,
        "estado_id":     estado_id,
        "headers":       headers,
    }
    return _ctx


# ---------------------------------------------------------------------------
# Helpers para fechas de reserva
# ---------------------------------------------------------------------------

def reserva_dates(iteration: int, base_offset: int = BASE_DATE_OFFSET) -> tuple:
    """Genera fechas no solapadas para la iteración dada.

    Cada reserva dura 2 noches con 1 día de buffer entre iteraciones
    → stride de 3 días por iteración.
    """
    today         = date.today()
    fecha_ingreso = today + timedelta(days=base_offset + iteration * 3)
    fecha_salida  = fecha_ingreso + timedelta(days=2)
    return fecha_ingreso.isoformat(), fecha_salida.isoformat()


# ---------------------------------------------------------------------------
# Helpers de limpieza
# ---------------------------------------------------------------------------

def delete_reserva(reserva_id: str, headers: dict) -> bool:
    """Intenta eliminar una reserva de prueba. Retorna True si tuvo éxito."""
    try:
        r = requests.delete(
            f"{BASE_URL}/reservas/{reserva_id}",
            headers=headers,
            timeout=15,
        )
        return r.status_code in (200, 204)
    except requests.RequestException:
        return False
