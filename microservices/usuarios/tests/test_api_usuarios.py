from datetime import datetime
from types import SimpleNamespace

import pytest

import app as app_module
from app.api.v1 import usuarios as usuarios_api


class TestConfig:
    TESTING = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    JWT_REFRESH_TOKEN_EXPIRES = 604800


def _user(user_id="u-1", nombre="Ana", email="ana@example.com", usuario="ana", ciudad_id=None):
    return SimpleNamespace(
        id=user_id,
        nombre=nombre,
        email=email,
        usuario=usuario,
        ciudad_id=ciudad_id,
        role="USER",
        status="ACTIVE",
        mfa_enabled=False,
        creado_en=datetime(2026, 1, 1, 0, 0, 0),
        contrasena="$2b$12$hashed"
    )


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setitem(app_module.config, "default", TestConfig)
    app = app_module.create_app("default")
    return app.test_client()


def test_create_usuario_without_payload_returns_400(client):
    response = client.post("/api/v1/usuarios", json=None)

    assert response.status_code == 415


def test_create_usuario_with_missing_field_returns_400(client):
    response = client.post(
        "/api/v1/usuarios",
        json={"nombre": "Ana", "email": "ana@example.com", "usuario": "ana"},
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "contrasena is required"


def test_create_usuario_with_duplicate_user_returns_409(client, monkeypatch):
    class FakeRepo:
        def find_by_usuario(self, usuario):
            return _user(usuario=usuario)

        def find_by_email(self, email):
            return None

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: FakeRepo())

    response = client.post(
        "/api/v1/usuarios",
        json={
            "nombre": "Ana",
            "email": "ana@example.com",
            "usuario": "ana",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 409
    assert response.get_json()["error"] == "Usuario already exists"


def test_create_usuario_with_duplicate_email_returns_409(client, monkeypatch):
    class FakeRepo:
        def find_by_usuario(self, usuario):
            return None

        def find_by_email(self, email):
            return _user(email=email)

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: FakeRepo())

    response = client.post(
        "/api/v1/usuarios",
        json={
            "nombre": "Ana",
            "email": "ana@example.com",
            "usuario": "ana",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 409
    assert response.get_json()["error"] == "Email already exists"


def test_create_usuario_success_returns_201(client, monkeypatch):
    class FakeRepo:
        def find_by_usuario(self, usuario):
            return None

        def find_by_email(self, email):
            return None

    class FakeCreateUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, **kwargs):
            return _user(
                user_id="u-100",
                nombre=kwargs["nombre"],
                email=kwargs["email"],
                usuario=kwargs["usuario"],
            )

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: FakeRepo())
    monkeypatch.setattr(usuarios_api, "CreateUsuarioUseCase", FakeCreateUsuarioUseCase)

    response = client.post(
        "/api/v1/usuarios",
        json={
            "nombre": "Ana",
            "email": "ana@example.com",
            "usuario": "ana",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["id"] == "u-100"
    assert data["usuario"] == "ana"


def test_get_usuario_not_found_returns_404(client, monkeypatch):
    class FakeGetUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id):
            return None

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "GetUsuarioUseCase", FakeGetUsuarioUseCase)

    response = client.get("/api/v1/usuarios/unknown")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Usuario not found"


def test_get_usuario_success_returns_200(client, monkeypatch):
    class FakeGetUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id):
            return _user(user_id=usuario_id)

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "GetUsuarioUseCase", FakeGetUsuarioUseCase)

    response = client.get("/api/v1/usuarios/u-1")

    assert response.status_code == 200
    assert response.get_json()["id"] == "u-1"


def test_get_all_usuarios_returns_list(client, monkeypatch):
    class FakeGetAllUsuariosUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self):
            return [_user(user_id="u-1"), _user(user_id="u-2", usuario="pepe")]

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "GetAllUsuariosUseCase", FakeGetAllUsuariosUseCase)

    response = client.get("/api/v1/usuarios")

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[1]["usuario"] == "pepe"


def test_update_usuario_without_payload_returns_400(client):
    response = client.put("/api/v1/usuarios/u-1", json=None)

    assert response.status_code == 415


def test_update_usuario_not_found_returns_404(client, monkeypatch):
    class FakeUpdateUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id, **kwargs):
            return None

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "UpdateUsuarioUseCase", FakeUpdateUsuarioUseCase)

    response = client.put("/api/v1/usuarios/u-1", json={"nombre": "Nuevo"})

    assert response.status_code == 404
    assert response.get_json()["error"] == "Usuario not found"


def test_update_usuario_success_returns_200(client, monkeypatch):
    class FakeUpdateUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id, **kwargs):
            return _user(user_id=usuario_id, nombre=kwargs.get("nombre", "Ana"))

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "UpdateUsuarioUseCase", FakeUpdateUsuarioUseCase)

    response = client.put("/api/v1/usuarios/u-1", json={"nombre": "Nuevo"})

    assert response.status_code == 200
    assert response.get_json()["nombre"] == "Nuevo"


def test_delete_usuario_not_found_returns_404(client, monkeypatch):
    class FakeDeleteUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id):
            return False

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "DeleteUsuarioUseCase", FakeDeleteUsuarioUseCase)

    response = client.delete("/api/v1/usuarios/u-1")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Usuario not found"


def test_delete_usuario_success_returns_200(client, monkeypatch):
    class FakeDeleteUsuarioUseCase:
        def __init__(self, repository):
            self.repository = repository

        def execute(self, usuario_id):
            return True

    monkeypatch.setattr(usuarios_api, "get_repository", lambda: object())
    monkeypatch.setattr(usuarios_api, "DeleteUsuarioUseCase", FakeDeleteUsuarioUseCase)

    response = client.delete("/api/v1/usuarios/u-1")

    assert response.status_code == 200
    assert response.get_json()["message"] == "Usuario deleted successfully"
