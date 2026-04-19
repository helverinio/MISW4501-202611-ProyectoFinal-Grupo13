import pytest

import app as app_module
from app.api.v1 import admin_auth as admin_auth_api


class TestConfig:
    TESTING = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    JWT_REFRESH_TOKEN_EXPIRES = 604800


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setitem(app_module.config, "default", TestConfig)
    app = app_module.create_app("default")
    return app.test_client()


def test_register_admin_without_payload_returns_400(client):
    response = client.post("/api/v1/admin/auth/register", json=None)

    assert response.status_code == 415


def test_register_admin_with_missing_field_returns_400(client):
    response = client.post(
        "/api/v1/admin/auth/register",
        json={"nombre": "Admin", "email": "admin@example.com"},
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "contrasena is required"


def test_register_admin_duplicate_email_returns_409(client, monkeypatch):
    class FakeRepo:
        def find_by_email(self, email):
            return object()

        def find_by_usuario(self, usuario):
            return None

    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: FakeRepo())

    response = client.post(
        "/api/v1/admin/auth/register",
        json={
            "nombre": "Admin",
            "email": "admin@example.com",
            "usuario": "admin",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 409
    assert response.get_json()["error"] == "Email already exists"


def test_register_admin_duplicate_usuario_returns_409(client, monkeypatch):
    class FakeRepo:
        def find_by_email(self, email):
            return None

        def find_by_usuario(self, usuario):
            return object()

    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: FakeRepo())

    response = client.post(
        "/api/v1/admin/auth/register",
        json={
            "nombre": "Admin",
            "email": "admin@example.com",
            "usuario": "admin",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 409
    assert response.get_json()["error"] == "Usuario already exists"


def test_register_admin_success_returns_201(client, monkeypatch):
    class FakeRepo:
        def find_by_email(self, email):
            return None

        def find_by_usuario(self, usuario):
            return None

    class FakeRegisterAdminUseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return {
                "id": "a-1",
                "email": kwargs["email"],
                "role": "ADMIN",
                "status": "PENDING_MFA",
                "setup_url": "http://localhost/setup",
                "otpauth_uri": "otpauth://totp/test",
            }

    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: FakeRepo())
    monkeypatch.setattr(admin_auth_api, "RegisterAdminUseCase", FakeRegisterAdminUseCase)

    response = client.post(
        "/api/v1/admin/auth/register",
        json={
            "nombre": "Admin",
            "email": "admin@example.com",
            "usuario": "admin",
            "contrasena": "secret",
        },
    )

    assert response.status_code == 201
    assert response.get_json()["role"] == "ADMIN"


def test_verify_setup_without_payload_returns_400(client):
    response = client.post("/api/v1/admin/auth/verify-setup", json=None)

    assert response.status_code == 415


def test_verify_setup_missing_fields_returns_400(client):
    response = client.post("/api/v1/admin/auth/verify-setup", json={"email": "x@example.com"})

    assert response.status_code == 400
    assert response.get_json()["error"] == "email and code are required"


def test_verify_setup_invalid_code_returns_401(client, monkeypatch):
    class FakeVerifyAdminSetupUseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return False

    monkeypatch.setattr(admin_auth_api, "VerifyAdminSetupUseCase", FakeVerifyAdminSetupUseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/verify-setup",
        json={"email": "admin@example.com", "code": "000000"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid setup verification code"


def test_verify_setup_success_returns_200(client, monkeypatch):
    class FakeVerifyAdminSetupUseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return True

    monkeypatch.setattr(admin_auth_api, "VerifyAdminSetupUseCase", FakeVerifyAdminSetupUseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/verify-setup",
        json={"email": "admin@example.com", "code": "123456"},
    )

    assert response.status_code == 200


def test_admin_login_step1_without_payload_returns_400(client):
    response = client.post("/api/v1/admin/auth/login/step1", json=None)

    assert response.status_code == 415


def test_admin_login_step1_missing_credentials_returns_400(client):
    response = client.post("/api/v1/admin/auth/login/step1", json={"usuario": "admin"})

    assert response.status_code == 400


def test_admin_login_step1_invalid_credentials_returns_401(client, monkeypatch):
    class FakeAdminLoginStep1UseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return None

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep1UseCase", FakeAdminLoginStep1UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step1",
        json={"usuario": "admin", "contrasena": "bad"},
    )

    assert response.status_code == 401


def test_admin_login_step1_locked_returns_423(client, monkeypatch):
    class FakeAdminLoginStep1UseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return {"locked": True, "locked_until": "2026-01-01T00:00:00"}

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep1UseCase", FakeAdminLoginStep1UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step1",
        json={"email": "admin@example.com", "contrasena": "secret"},
    )

    assert response.status_code == 423


def test_admin_login_step1_setup_required_returns_403(client, monkeypatch):
    class FakeAdminLoginStep1UseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return {"setup_required": True}

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep1UseCase", FakeAdminLoginStep1UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step1",
        json={"usuario": "admin", "contrasena": "secret"},
    )

    assert response.status_code == 403


def test_admin_login_step1_success_returns_200(client, monkeypatch):
    class FakeAdminLoginStep1UseCase:
        def __init__(self, repo):
            self.repo = repo

        def execute(self, **kwargs):
            return {"mfa_required": True, "challenge_token": "challenge", "expires_in": 300}

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep1UseCase", FakeAdminLoginStep1UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step1",
        json={"usuario": "admin", "contrasena": "secret"},
    )

    assert response.status_code == 200
    assert response.get_json()["mfa_required"] is True


def test_admin_login_step2_without_payload_returns_400(client):
    response = client.post("/api/v1/admin/auth/login/step2", json=None)

    assert response.status_code == 415


def test_admin_login_step2_missing_fields_returns_400(client):
    response = client.post("/api/v1/admin/auth/login/step2", json={"challenge_token": "x"})

    assert response.status_code == 400


def test_admin_login_step2_invalid_challenge_returns_401(client, monkeypatch):
    class FakeAdminLoginStep2UseCase:
        def __init__(self, usuario_repo, token_repo):
            self.usuario_repo = usuario_repo
            self.token_repo = token_repo

        def execute(self, **kwargs):
            return None

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep2UseCase", FakeAdminLoginStep2UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(admin_auth_api, "get_token_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step2",
        json={"challenge_token": "bad", "code": "000000"},
    )

    assert response.status_code == 401


def test_admin_login_step2_success_returns_200(client, monkeypatch):
    class FakeAdminLoginStep2UseCase:
        def __init__(self, usuario_repo, token_repo):
            self.usuario_repo = usuario_repo
            self.token_repo = token_repo

        def execute(self, **kwargs):
            return {
                "access_token": "acc",
                "refresh_token": "ref",
                "token_type": "Bearer",
                "expires_in": 3600,
            }

    monkeypatch.setattr(admin_auth_api, "AdminLoginStep2UseCase", FakeAdminLoginStep2UseCase)
    monkeypatch.setattr(admin_auth_api, "get_usuario_repository", lambda: object())
    monkeypatch.setattr(admin_auth_api, "get_token_repository", lambda: object())

    response = client.post(
        "/api/v1/admin/auth/login/step2",
        json={"challenge_token": "ok", "code": "123456"},
    )

    assert response.status_code == 200
    assert response.get_json()["access_token"] == "acc"
