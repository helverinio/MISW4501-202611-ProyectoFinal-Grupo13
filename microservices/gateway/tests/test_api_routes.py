import pytest

from app import create_app


class FakeReservasService:
    def __getattr__(self, name):
        def _handler(*args, **kwargs):
            return {"status_code": 200, "data": {"handler": name, "args": list(args)}}

        return _handler


class FakePagosService:
    def __getattr__(self, name):
        def _handler(*args, **kwargs):
            return {"status_code": 200, "data": {"handler": name, "args": list(args)}}

        return _handler


@pytest.fixture
def client(monkeypatch):
    import app.api.v1.ciudades as ciudades
    import app.api.v1.estados as estados
    import app.api.v1.habitaciones as habitaciones
    import app.api.v1.hoteles as hoteles
    import app.api.v1.notificaciones as notificaciones
    import app.api.v1.pagos as pagos
    import app.api.v1.paises as paises
    import app.api.v1.reservas as reservas
    import app.api.v1.tarifas as tarifas

    fake_reservas = FakeReservasService()
    fake_pagos = FakePagosService()

    monkeypatch.setattr(paises, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(ciudades, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(hoteles, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(habitaciones, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(tarifas, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(estados, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(reservas, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(notificaciones, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(pagos, "get_pagos_service", lambda: fake_pagos)

    app = create_app("default")
    app.config.update(TESTING=True)
    return app.test_client()


def test_health_endpoints(client):
    root_health = client.get("/health")
    assert root_health.status_code == 200
    assert root_health.get_json()["service"] == "gateway"


@pytest.mark.parametrize(
    "method,url,payload",
    [
        ("post", "/api/v1/paises", {"name": "CO"}),
        ("get", "/api/v1/paises/1", None),
        ("get", "/api/v1/paises", None),
        ("put", "/api/v1/paises/1", {"name": "COL"}),
        ("delete", "/api/v1/paises/1", None),
        ("get", "/api/v1/paises/1/ciudades", None),
        ("post", "/api/v1/ciudades", {"name": "Bogota"}),
        ("get", "/api/v1/ciudades/1", None),
        ("get", "/api/v1/ciudades", None),
        ("put", "/api/v1/ciudades/1", {"name": "Medellin"}),
        ("delete", "/api/v1/ciudades/1", None),
        ("get", "/api/v1/ciudades/1/hoteles", None),
        ("post", "/api/v1/hoteles", {"name": "Hotel"}),
        ("get", "/api/v1/hoteles/1", None),
        ("get", "/api/v1/hoteles", None),
        ("put", "/api/v1/hoteles/1", {"name": "Hotel2"}),
        ("delete", "/api/v1/hoteles/1", None),
        ("get", "/api/v1/hoteles/1/habitaciones", None),
        ("post", "/api/v1/hoteles/buscar-disponibles", {"busqueda": "Bogota", "fecha_ingreso": "2026-04-01", "fecha_salida": "2026-04-05", "nro_personas": 2}),
        ("post", "/api/v1/habitaciones", {"name": "Suite"}),
        ("get", "/api/v1/habitaciones/1", None),
        ("get", "/api/v1/habitaciones", None),
        ("put", "/api/v1/habitaciones/1", {"name": "Junior"}),
        ("delete", "/api/v1/habitaciones/1", None),
        ("get", "/api/v1/habitaciones/1/tarifas", None),
        ("get", "/api/v1/habitaciones/1/reservas", None),
        ("post", "/api/v1/habitaciones/1/hold", {"reservation_id": "r1"}),
        ("post", "/api/v1/habitaciones/1/hold/check", {"reservation_id": "r1"}),
        ("get", "/api/v1/holds/h1", None),
        ("delete", "/api/v1/holds/h1", None),
        ("post", "/api/v1/holds/cleanup", None),
        ("post", "/api/v1/tarifas", {"price": 120}),
        ("get", "/api/v1/tarifas/1", None),
        ("get", "/api/v1/tarifas", None),
        ("put", "/api/v1/tarifas/1", {"price": 130}),
        ("delete", "/api/v1/tarifas/1", None),
        ("post", "/api/v1/estados", {"name": "confirmada"}),
        ("get", "/api/v1/estados/1", None),
        ("get", "/api/v1/estados", None),
        ("put", "/api/v1/estados/1", {"name": "pagada"}),
        ("delete", "/api/v1/estados/1", None),
        ("post", "/api/v1/reservas", {"usuario_id": "u1"}),
        ("get", "/api/v1/reservas/1", None),
        ("get", "/api/v1/reservas", None),
        ("put", "/api/v1/reservas/1", {"estado": "confirmada"}),
        ("delete", "/api/v1/reservas/1", None),
        ("get", "/api/v1/usuarios/u1/reservas", None),
        ("get", "/api/v1/reservas/1/pagos", None),
        ("get", "/api/v1/reservas/1/notificaciones", None),
        ("post", "/api/v1/reservas/webhook/pms", {"id": "w1"}),
        ("post", "/api/v1/payments/webhook", {"payment_intent_id": "pi1"}),
        ("post", "/api/v1/notificaciones", {"reserva_id": "1"}),
        ("get", "/api/v1/notificaciones/1", None),
        ("get", "/api/v1/notificaciones", None),
        ("put", "/api/v1/notificaciones/1", {"estado": "enviado"}),
        ("delete", "/api/v1/notificaciones/1", None),
        ("post", "/api/v1/payments", {"reservation_id": "r1"}),
        ("get", "/api/v1/payments/1", None),
        ("get", "/api/v1/payments", None),
        ("get", "/api/v1/payments/reservation/r1", None),
        ("post", "/api/v1/payments/1/process", None),
    ],
)
def test_api_routes_success(client, method, url, payload):
    caller = getattr(client, method)
    response = caller(url, json=payload) if payload is not None else caller(url)

    assert response.status_code == 200
    body = response.get_json()
    assert "handler" in body


@pytest.mark.parametrize(
    "method,url",
    [
        ("post", "/api/v1/paises"),
        ("put", "/api/v1/paises/1"),
        ("post", "/api/v1/ciudades"),
        ("put", "/api/v1/ciudades/1"),
        ("post", "/api/v1/hoteles"),
        ("put", "/api/v1/hoteles/1"),
        ("post", "/api/v1/hoteles/buscar-disponibles"),
        ("post", "/api/v1/habitaciones"),
        ("put", "/api/v1/habitaciones/1"),
        ("post", "/api/v1/habitaciones/1/hold"),
        ("post", "/api/v1/habitaciones/1/hold/check"),
        ("post", "/api/v1/tarifas"),
        ("put", "/api/v1/tarifas/1"),
        ("post", "/api/v1/estados"),
        ("put", "/api/v1/estados/1"),
        ("post", "/api/v1/reservas"),
        ("put", "/api/v1/reservas/1"),
        ("post", "/api/v1/reservas/webhook/pms"),
        ("post", "/api/v1/payments/webhook"),
        ("post", "/api/v1/notificaciones"),
        ("put", "/api/v1/notificaciones/1"),
        ("post", "/api/v1/payments"),
    ],
)
def test_api_routes_validation_empty_payload(client, method, url):
    caller = getattr(client, method)
    response = caller(url, json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"
