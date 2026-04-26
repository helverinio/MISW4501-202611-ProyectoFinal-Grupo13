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


class FakeUsuariosService:
    def __getattr__(self, name):
        def _handler(*args, **kwargs):
            return {"status_code": 200, "data": {"handler": name, "args": list(args)}}

        return _handler


@pytest.fixture
def client(monkeypatch):
    import app.api.v1.admin_hoteles as admin_hoteles
    import app.api.v1.ciudades as ciudades
    import app.api.v1.estados as estados
    import app.api.v1.habitaciones as habitaciones
    import app.api.v1.hoteles as hoteles
    import app.api.v1.notificaciones as notificaciones
    import app.api.v1.pagos as pagos
    import app.api.v1.paises as paises
    import app.api.v1.planes_tarifarios as planes_tarifarios
    import app.api.v1.reservas as reservas
    import app.api.v1.tarifas as tarifas
    import app.api.v1.tipos_habitacion as tipos_habitacion
    import app.api.v1.usuarios as usuarios

    fake_reservas = FakeReservasService()
    fake_pagos = FakePagosService()
    fake_usuarios = FakeUsuariosService()

    monkeypatch.setattr(paises, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(ciudades, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(hoteles, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(habitaciones, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(tarifas, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(estados, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(reservas, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(notificaciones, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(pagos, "get_pagos_service", lambda: fake_pagos)
    monkeypatch.setattr(admin_hoteles, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(planes_tarifarios, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(tipos_habitacion, "get_service", lambda: fake_reservas)
    monkeypatch.setattr(usuarios, "get_service", lambda: fake_usuarios)

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
        ("get", "/api/v1/hoteles/populares-por-ciudad?limit=4", None),
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
        # Usuarios CRUD
        ("post", "/api/v1/usuarios", {"email": "test@test.com", "nombre": "Test"}),
        ("get", "/api/v1/usuarios/u1", None),
        ("get", "/api/v1/usuarios", None),
        ("put", "/api/v1/usuarios/u1", {"nombre": "Updated"}),
        ("delete", "/api/v1/usuarios/u1", None),
        # Auth
        ("post", "/api/v1/auth/login", {"email": "a@b.com", "contrasena": "pass"}),
        ("post", "/api/v1/auth/refresh", {"token": "abc"}),
        ("get", "/api/v1/auth/me", None),
        ("post", "/api/v1/auth/logout", None),
        # Admin auth (MFA)
        ("post", "/api/v1/admin/auth/register", {"email": "admin@test.com", "contrasena": "p"}),
        ("post", "/api/v1/admin/auth/verify-setup", {"token": "abc"}),
        ("post", "/api/v1/admin/auth/login/step1", {"email": "a@b.com", "contrasena": "p"}),
        ("post", "/api/v1/admin/auth/login/step2", {"mfa_code": "123456"}),
        # Admin hoteles
        ("get", "/api/v1/admin/mis-hoteles", None),
        ("post", "/api/v1/admin/hoteles/h1/asignar", None),
        ("delete", "/api/v1/admin/hoteles/h1/desasignar", None),
        ("get", "/api/v1/admin/reservas/dashboard", None),
        ("put", "/api/v1/admin/reservas/r1/estado", {"id_estado": "s1"}),
        # Tipos habitacion
        ("get", "/api/v1/hoteles/h1/tipos-habitacion", None),
        ("post", "/api/v1/hoteles/h1/tipos-habitacion", {"nombre": "Suite"}),
        ("get", "/api/v1/tipos-habitacion/t1", None),
        ("put", "/api/v1/tipos-habitacion/t1", {"nombre": "Junior"}),
        ("delete", "/api/v1/tipos-habitacion/t1", None),
        # Planes tarifarios
        ("get", "/api/v1/tipos-habitacion/t1/planes-tarifarios", None),
        ("post", "/api/v1/tipos-habitacion/t1/planes-tarifarios", {"nombre": "Plan A"}),
        ("get", "/api/v1/planes-tarifarios/p1", None),
        ("put", "/api/v1/planes-tarifarios/p1", {"nombre": "Plan B"}),
        ("delete", "/api/v1/planes-tarifarios/p1", None),
        # Reglas tarifarias
        ("get", "/api/v1/planes-tarifarios/p1/reglas", None),
        ("post", "/api/v1/planes-tarifarios/p1/reglas", {"condicion": "weekend"}),
        ("get", "/api/v1/reglas-tarifarias/r1", None),
        ("put", "/api/v1/reglas-tarifarias/r1", {"condicion": "weekday"}),
        ("delete", "/api/v1/reglas-tarifarias/r1", None),
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
        # Usuarios
        ("post", "/api/v1/usuarios"),
        ("put", "/api/v1/usuarios/u1"),
        # Auth
        ("post", "/api/v1/auth/login"),
        ("post", "/api/v1/auth/refresh"),
        # Admin auth
        ("post", "/api/v1/admin/auth/register"),
        ("post", "/api/v1/admin/auth/verify-setup"),
        ("post", "/api/v1/admin/auth/login/step1"),
        ("post", "/api/v1/admin/auth/login/step2"),
        # Tipos habitacion
        ("post", "/api/v1/hoteles/h1/tipos-habitacion"),
        ("put", "/api/v1/tipos-habitacion/t1"),
        # Planes tarifarios
        ("post", "/api/v1/tipos-habitacion/t1/planes-tarifarios"),
        ("put", "/api/v1/planes-tarifarios/p1"),
        ("post", "/api/v1/planes-tarifarios/p1/reglas"),
        ("put", "/api/v1/reglas-tarifarias/r1"),
    ],
)
def test_api_routes_validation_empty_payload(client, method, url):
    caller = getattr(client, method)
    response = caller(url, json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_login_validation_missing_contrasena(client):
    response = client.post("/api/v1/auth/login", json={"email": "a@b.com"})
    assert response.status_code == 400
    assert response.get_json()["error"] == "email or usuario, and contrasena are required"


def test_login_validation_missing_email_and_usuario(client):
    response = client.post("/api/v1/auth/login", json={"contrasena": "pass"})
    assert response.status_code == 400
    assert response.get_json()["error"] == "email or usuario, and contrasena are required"


def test_login_with_usuario_field(client):
    response = client.post("/api/v1/auth/login", json={"usuario": "admin", "contrasena": "pass"})
    assert response.status_code == 200
    body = response.get_json()
    assert "handler" in body
