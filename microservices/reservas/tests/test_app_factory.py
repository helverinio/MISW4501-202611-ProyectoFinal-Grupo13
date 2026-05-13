from unittest.mock import Mock

import app as app_module
import app.infrastructure.services as services_module


class FakeHealthyRedisService:
    def health_check(self):
        return {"status": "healthy"}


class DummyConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PAGOS_SERVICE_URL = "http://localhost:5002"


def patch_app_config(monkeypatch):
    monkeypatch.setattr(app_module, "config", {"default": DummyConfig})


def test_create_app_health_with_redis_service(monkeypatch):
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, "init_redis_lock_service", lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(services_module, "init_firebase", lambda *_: None)
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    client = flask_app.test_client()

    response = client.get("/health")
    data = response.get_json()

    assert response.status_code == 200
    assert data["status"] == "healthy"
    assert data["service"] == "reservas"
    assert data["redis"]["status"] == "healthy"


def test_create_app_health_when_redis_init_fails(monkeypatch):
    patch_app_config(monkeypatch)
    def raise_init_error(_config):
        raise RuntimeError("redis down")

    monkeypatch.setattr(services_module, "init_redis_lock_service", raise_init_error)
    monkeypatch.setattr(services_module, "init_firebase", lambda *_: None)
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    client = flask_app.test_client()

    response = client.get("/health")
    data = response.get_json()

    assert response.status_code == 200
    assert data["status"] == "healthy"
    assert data["redis"]["status"] == "unavailable"


def test_request_logging_hooks_run_without_errors(monkeypatch):
    fake_logger = Mock()

    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, "init_redis_lock_service", lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(services_module, "init_firebase", lambda *_: None)
    monkeypatch.setattr(app_module, "setup_logging", lambda _app: fake_logger)
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    client = flask_app.test_client()

    response = client.get("/health")

    assert response.status_code == 200
    assert fake_logger.info.called
