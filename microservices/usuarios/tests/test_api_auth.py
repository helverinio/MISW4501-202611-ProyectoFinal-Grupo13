from datetime import datetime
from types import SimpleNamespace

import pytest

import app as app_module
from app.api.v1 import auth as auth_api


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
    )


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setitem(app_module.config, "default", TestConfig)
    app = app_module.create_app("default")
    return app.test_client()


def test_login_without_payload_returns_400(client):
    response = client.post("/api/v1/auth/login", json=None)

    assert response.status_code == 415


def test_login_without_credentials_returns_400(client):
    response = client.post("/api/v1/auth/login", json={"usuario": "ana"})

    assert response.status_code == 400
    assert response.get_json()["error"] == "email or usuario, and contrasena are required"


def test_login_invalid_credentials_returns_401(client, monkeypatch):
    class FakeAuthenticateUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, usuario, contrasena):
            return None

    monkeypatch.setattr(auth_api, "AuthenticateUseCase", FakeAuthenticateUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post(
        "/api/v1/auth/login",
        json={"usuario": "ana", "contrasena": "wrong"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid credentials"


def test_login_success_returns_tokens(client, monkeypatch):
    class FakeAuthenticateUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, usuario, contrasena):
            return {
                "access_token": "acc",
                "refresh_token": "ref",
                "token_type": "Bearer",
                "expires_in": 3600,
                "usuario": {"id": "u-1", "usuario": usuario},
            }

    monkeypatch.setattr(auth_api, "AuthenticateUseCase", FakeAuthenticateUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post(
        "/api/v1/auth/login",
        json={"usuario": "ana", "contrasena": "secret"},
    )

    assert response.status_code == 200
    assert response.get_json()["token_type"] == "Bearer"


def test_login_success_with_email_returns_tokens(client, monkeypatch):
    class FakeAuthenticateUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, identifier, contrasena):
            return {
                "access_token": "acc",
                "refresh_token": "ref",
                "token_type": "Bearer",
                "expires_in": 3600,
                "usuario": {"id": "u-1", "email": identifier},
            }

    monkeypatch.setattr(auth_api, "AuthenticateUseCase", FakeAuthenticateUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ana@example.com", "contrasena": "secret"},
    )

    assert response.status_code == 200
    assert response.get_json()["token_type"] == "Bearer"


def test_refresh_without_payload_returns_400(client):
    response = client.post("/api/v1/auth/refresh", json=None)

    assert response.status_code == 415


def test_refresh_without_token_returns_400(client):
    response = client.post("/api/v1/auth/refresh", json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_refresh_invalid_token_returns_401(client, monkeypatch):
    class FakeRefreshTokenUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, refresh_token):
            return None

    monkeypatch.setattr(auth_api, "RefreshTokenUseCase", FakeRefreshTokenUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": "bad"})

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid or expired refresh token"


def test_refresh_success_returns_tokens(client, monkeypatch):
    class FakeRefreshTokenUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, refresh_token):
            return {
                "access_token": "acc-2",
                "refresh_token": "ref-2",
                "token_type": "Bearer",
                "expires_in": 3600,
                "usuario": {"id": "u-1", "usuario": "ana"},
            }

    monkeypatch.setattr(auth_api, "RefreshTokenUseCase", FakeRefreshTokenUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": "ok"})

    assert response.status_code == 200
    assert response.get_json()["access_token"] == "acc-2"


def test_auth_me_without_authorization_header_returns_401(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.get_json()["error"] == "Authorization header is required"


def test_auth_me_with_invalid_header_format_returns_401(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "badformat"})

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid authorization header format"


def test_auth_me_with_invalid_token_returns_401(client, monkeypatch):
    class FakeGetUsuarioByTokenUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, access_token):
            return None

    monkeypatch.setattr(auth_api, "GetUsuarioByTokenUseCase", FakeGetUsuarioByTokenUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bad"})

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid or expired token"


def test_auth_me_success_returns_user(client, monkeypatch):
    class FakeGetUsuarioByTokenUseCase:
        def __init__(self, usuario_repository, token_repository):
            self.usuario_repository = usuario_repository
            self.token_repository = token_repository

        def execute(self, access_token):
            return _user(user_id="u-9", usuario="pepe")

    monkeypatch.setattr(auth_api, "GetUsuarioByTokenUseCase", FakeGetUsuarioByTokenUseCase)
    monkeypatch.setattr(auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer good"})

    assert response.status_code == 200
    assert response.get_json()["id"] == "u-9"


def test_logout_without_authorization_header_returns_401(client):
    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 401
    assert response.get_json()["error"] == "Authorization header is required"


def test_logout_with_invalid_header_format_returns_401(client):
    response = client.post("/api/v1/auth/logout", headers={"Authorization": "badformat"})

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid authorization header format"


def test_logout_success_returns_200(client, monkeypatch):
    captured = {}

    class FakeRevokeTokenUseCase:
        def __init__(self, token_repository):
            self.token_repository = token_repository

        def execute(self, access_token):
            captured["token"] = access_token
            return True

    monkeypatch.setattr(auth_api, "RevokeTokenUseCase", FakeRevokeTokenUseCase)
    monkeypatch.setattr(auth_api, "get_token_repository", lambda: object())

    response = client.post("/api/v1/auth/logout", headers={"Authorization": "Bearer acc"})

    assert response.status_code == 200
    assert response.get_json()["message"] == "Logged out successfully"
    assert captured["token"] == "acc"
