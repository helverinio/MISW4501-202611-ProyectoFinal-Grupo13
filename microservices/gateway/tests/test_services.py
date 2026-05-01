import pytest
from flask import Flask

from app.services.pagos_service import PagosService
from app.services.reservas_service import ReservasService
from app.services.usuarios_service import UsuariosService


class DummyResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {"ok": True}

    def json(self):
        return self._payload


def test_reservas_service_request_variants(monkeypatch):
    service = ReservasService("http://reservas")

    monkeypatch.setattr(
        "app.services.reservas_service.requests.get",
        lambda url, headers, timeout: DummyResponse(200, {"method": "GET", "url": url, "headers": headers}),
    )
    monkeypatch.setattr(
        "app.services.reservas_service.requests.post",
        lambda url, json, headers, timeout: DummyResponse(201, {"method": "POST", "json": json, "headers": headers}),
    )
    monkeypatch.setattr(
        "app.services.reservas_service.requests.put",
        lambda url, json, headers, timeout: DummyResponse(202, {"method": "PUT", "json": json, "headers": headers}),
    )
    monkeypatch.setattr(
        "app.services.reservas_service.requests.delete",
        lambda url, headers, timeout: DummyResponse(204, {"method": "DELETE", "headers": headers}),
    )

    get_result = service._request("GET", "paises")
    assert get_result["status_code"] == 200
    assert get_result["data"]["method"] == "GET"

    post_result = service._request("POST", "paises", {"name": "CO"})
    assert post_result["status_code"] == 201

    put_result = service._request("PUT", "paises/1", {"name": "COL"})
    assert put_result["status_code"] == 202

    delete_result = service._request("DELETE", "paises/1")
    assert delete_result["status_code"] == 204

    invalid_result = service._request("PATCH", "paises/1")
    assert invalid_result["status_code"] == 400


def test_reservas_service_forwards_authorization_header(monkeypatch):
    captured = {}

    def fake_get(url, headers, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["timeout"] = timeout
        return DummyResponse(200, {"ok": True})

    monkeypatch.setattr("app.services.reservas_service.requests.get", fake_get)

    app = Flask(__name__)
    service = ReservasService("http://reservas")

    with app.test_request_context(headers={"Authorization": "Bearer token-123"}):
        result = service.get_all_hoteles()

    assert result["status_code"] == 200
    assert captured["headers"] == {"Authorization": "Bearer token-123"}


def test_reservas_service_request_exception(monkeypatch):
    class BoomRequestException(Exception):
        pass

    def failing_get(url, headers, timeout):
        raise BoomRequestException("downstream is down")

    monkeypatch.setattr("app.services.reservas_service.requests.get", failing_get)
    monkeypatch.setattr(
        "app.services.reservas_service.requests.RequestException", BoomRequestException
    )

    service = ReservasService("http://reservas")
    result = service._request("GET", "paises")

    assert result["status_code"] == 500
    assert "downstream is down" in result["data"]["error"]


@pytest.mark.parametrize(
    "method_name,args",
    [
        ("create_pais", ({"name": "CO"},)),
        ("get_pais", ("1",)),
        ("get_all_paises", ()),
        ("update_pais", ("1", {"name": "COL"})),
        ("delete_pais", ("1",)),
        ("get_ciudades_by_pais", ("1",)),
        ("create_ciudad", ({"name": "Bogota"},)),
        ("get_ciudad", ("2",)),
        ("get_all_ciudades", ()),
        ("update_ciudad", ("2", {"name": "Medellin"})),
        ("delete_ciudad", ("2",)),
        ("get_hoteles_by_ciudad", ("2",)),
        ("create_hotel", ({"name": "Hotel A"},)),
        ("get_hotel", ("3",)),
        ("get_all_hoteles", ()),
        ("update_hotel", ("3", {"name": "Hotel B"})),
        ("delete_hotel", ("3",)),
        ("get_habitaciones_by_hotel", ("3",)),
        ("search_available_hotels", ({"busqueda": "Bogota", "fecha_ingreso": "2026-04-01", "fecha_salida": "2026-04-05", "nro_personas": 2},)),
        ("create_habitacion", ({"name": "Suite"},)),
        ("get_habitacion", ("4",)),
        ("get_all_habitaciones", ()),
        ("update_habitacion", ("4", {"name": "Junior"})),
        ("delete_habitacion", ("4",)),
        ("get_tarifas_by_habitacion", ("4",)),
        ("get_reservas_by_habitacion", ("4",)),
        ("acquire_room_hold", ("4", {"reservation_id": "r1"})),
        ("check_room_hold", ("4", {"reservation_id": "r1"})),
        ("get_hold", ("h1",)),
        ("release_hold", ("h1",)),
        ("cleanup_expired_holds", ()),
        ("create_tarifa", ({"price": 100},)),
        ("get_tarifa", ("5",)),
        ("get_all_tarifas", ()),
        ("update_tarifa", ("5", {"price": 110})),
        ("delete_tarifa", ("5",)),
        ("create_estado", ({"name": "Confirmada"},)),
        ("get_estado", ("6",)),
        ("get_all_estados", ()),
        ("update_estado", ("6", {"name": "Pagada"})),
        ("delete_estado", ("6",)),
        ("create_reserva", ({"usuario_id": "u1"},)),
        ("get_reserva", ("7",)),
        ("get_all_reservas", ()),
        ("update_reserva", ("7", {"estado": "confirmada"})),
        ("delete_reserva", ("7",)),
        ("get_reservas_by_usuario", ("u1",)),
        ("create_reserva_pms_webhook", ({"id": "w1"},)),
        ("get_pagos_by_reserva", ("7",)),
        ("get_notificaciones_by_reserva", ("7",)),
        ("create_pago", ({"reserva_id": "7"},)),
        ("get_pago", ("8",)),
        ("get_all_pagos", ()),
        ("update_pago", ("8", {"status": "ok"})),
        ("delete_pago", ("8",)),
        ("create_notificacion", ({"reserva_id": "7"},)),
        ("get_notificacion", ("9",)),
        ("get_all_notificaciones", ()),
        ("update_notificacion", ("9", {"status": "sent"})),
        ("delete_notificacion", ("9",)),
        ("payment_webhook", ({"payment_intent_id": "pi1"},)),
    ],
)
def test_reservas_wrappers_delegate_to_request(monkeypatch, method_name, args):
    captured = {}

    def fake_request(method, endpoint, data=None, params=None):
        captured["method"] = method
        captured["endpoint"] = endpoint
        captured["data"] = data
        captured["params"] = params
        return {"status_code": 200, "data": {"ok": True}}

    service = ReservasService("http://reservas")
    monkeypatch.setattr(service, "_request", fake_request)

    result = getattr(service, method_name)(*args)

    assert result["status_code"] == 200
    assert captured["method"] in {"GET", "POST", "PUT", "DELETE"}


def test_pagos_service_request_variants(monkeypatch):
    service = PagosService("http://pagos")

    monkeypatch.setattr(
        "app.services.pagos_service.requests.get",
        lambda url, timeout: DummyResponse(200, {"method": "GET", "url": url}),
    )
    monkeypatch.setattr(
        "app.services.pagos_service.requests.post",
        lambda url, json, timeout: DummyResponse(201, {"method": "POST", "json": json}),
    )
    monkeypatch.setattr(
        "app.services.pagos_service.requests.put",
        lambda url, json, timeout: DummyResponse(202, {"method": "PUT", "json": json}),
    )
    monkeypatch.setattr(
        "app.services.pagos_service.requests.delete",
        lambda url, timeout: DummyResponse(204, {"method": "DELETE"}),
    )

    assert service._request("GET", "payments")["status_code"] == 200
    assert service._request("POST", "payments", {"id": "1"})["status_code"] == 201
    assert service._request("PUT", "payments/1", {"id": "1"})["status_code"] == 202
    assert service._request("DELETE", "payments/1")["status_code"] == 204

    invalid_result = service._request("PATCH", "payments/1")
    assert invalid_result["status_code"] == 400


def test_pagos_service_request_exception(monkeypatch):
    class BoomRequestException(Exception):
        pass

    def failing_get(url, timeout):
        raise BoomRequestException("pagos down")

    monkeypatch.setattr("app.services.pagos_service.requests.get", failing_get)
    monkeypatch.setattr(
        "app.services.pagos_service.requests.RequestException", BoomRequestException
    )

    service = PagosService("http://pagos")
    result = service._request("GET", "payments")

    assert result["status_code"] == 500
    assert "pagos down" in result["data"]["error"]


@pytest.mark.parametrize(
    "method_name,args",
    [
        ("create_payment", ({"reservation_id": "r1"},)),
        ("get_payment", ("1",)),
        ("get_all_payments", ()),
        ("get_payment_by_reservation", ("r1",)),
        ("process_payment", ("1",)),
    ],
)
def test_pagos_wrappers_delegate_to_request(monkeypatch, method_name, args):
    captured = {}

    def fake_request(method, endpoint, data=None):
        captured["method"] = method
        captured["endpoint"] = endpoint
        captured["data"] = data
        return {"status_code": 200, "data": {"ok": True}}

    service = PagosService("http://pagos")
    monkeypatch.setattr(service, "_request", fake_request)

    result = getattr(service, method_name)(*args)

    assert result["status_code"] == 200
    assert captured["method"] in {"GET", "POST", "PUT", "DELETE"}


# ── UsuariosService ────────────────────────────────────────────────────────────

def test_usuarios_service_request_variants(monkeypatch):
    service = UsuariosService("http://usuarios")

    monkeypatch.setattr(
        "app.services.usuarios_service.requests.get",
        lambda url, headers, timeout: DummyResponse(200, {"method": "GET", "url": url}),
    )
    monkeypatch.setattr(
        "app.services.usuarios_service.requests.post",
        lambda url, json, headers, timeout: DummyResponse(201, {"method": "POST", "json": json}),
    )
    monkeypatch.setattr(
        "app.services.usuarios_service.requests.put",
        lambda url, json, headers, timeout: DummyResponse(202, {"method": "PUT", "json": json}),
    )
    monkeypatch.setattr(
        "app.services.usuarios_service.requests.delete",
        lambda url, headers, timeout: DummyResponse(204, {"method": "DELETE"}),
    )

    get_result = service._request("GET", "usuarios")
    assert get_result["status_code"] == 200
    assert get_result["data"]["method"] == "GET"

    post_result = service._request("POST", "usuarios", {"email": "a@b.com"})
    assert post_result["status_code"] == 201

    put_result = service._request("PUT", "usuarios/u1", {"nombre": "Updated"})
    assert put_result["status_code"] == 202

    delete_result = service._request("DELETE", "usuarios/u1")
    assert delete_result["status_code"] == 204

    invalid_result = service._request("PATCH", "usuarios/u1")
    assert invalid_result["status_code"] == 400


def test_usuarios_service_request_with_headers(monkeypatch):
    captured = {}

    def fake_get(url, headers, timeout):
        captured["headers"] = headers
        return DummyResponse(200, {"ok": True})

    monkeypatch.setattr("app.services.usuarios_service.requests.get", fake_get)

    service = UsuariosService("http://usuarios")
    result = service._request("GET", "auth/me", headers={"Authorization": "Bearer tok-123"})

    assert result["status_code"] == 200
    assert captured["headers"] == {"Authorization": "Bearer tok-123"}


def test_usuarios_service_request_exception(monkeypatch):
    class BoomRequestException(Exception):
        pass

    def failing_get(url, headers, timeout):
        raise BoomRequestException("usuarios down")

    monkeypatch.setattr("app.services.usuarios_service.requests.get", failing_get)
    monkeypatch.setattr(
        "app.services.usuarios_service.requests.RequestException", BoomRequestException
    )

    service = UsuariosService("http://usuarios")
    result = service._request("GET", "usuarios")

    assert result["status_code"] == 500
    assert "usuarios down" in result["data"]["error"]


@pytest.mark.parametrize(
    "method_name,args",
    [
        ("create_usuario", ({"email": "a@b.com"},)),
        ("get_usuario", ("u1",)),
        ("get_all_usuarios", ()),
        ("update_usuario", ("u1", {"email": "new@b.com"})),
        ("delete_usuario", ("u1",)),
        ("login", ({"email": "a@b.com", "contrasena": "pass"},)),
        ("refresh_token", ({"token": "tok"},)),
        ("get_current_user", ()),
        ("get_current_user", ("Bearer tok",)),
        ("logout", ()),
        ("logout", ("Bearer tok",)),
        ("register_admin", ({"email": "admin@b.com"},)),
        ("verify_admin_setup", ({"token": "abc"},)),
        ("admin_login_step1", ({"email": "a@b.com", "contrasena": "p"},)),
        ("admin_login_step2", ({"mfa_code": "123456"},)),
    ],
)
def test_usuarios_wrappers_delegate_to_request(monkeypatch, method_name, args):
    captured = {}

    def fake_request(method, endpoint, data=None, headers=None):
        captured["method"] = method
        captured["endpoint"] = endpoint
        captured["data"] = data
        captured["headers"] = headers
        return {"status_code": 200, "data": {"ok": True}}

    service = UsuariosService("http://usuarios")
    monkeypatch.setattr(service, "_request", fake_request)

    result = getattr(service, method_name)(*args)

    assert result["status_code"] == 200
    assert captured["method"] in {"GET", "POST", "PUT", "DELETE"}

