from datetime import datetime
from types import SimpleNamespace

import pytest

import app as app_module
import app.api.v1.auth as auth_module
import app.api.v1.reservas as reservas_api
import app.infrastructure.services as services_module

class FakeHealthyRedisService:
    def health_check(self):
        return {"status": "healthy"}


class DummyConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PAGOS_SERVICE_URL = "http://localhost:5002"


class FakeAuthService:
    def validate_token(self, _token):
        return {"id": "user-1", "usuario": "tester"}


class FixedResultUseCase:
    def __init__(self, result):
        self.result = result

    def execute(self, *_args, **_kwargs):
        return self.result


def make_reserva(reserva_id="res-1"):
    return SimpleNamespace(
        id=reserva_id,
        fecha_ingreso=datetime(2026, 4, 20, 0, 0, 0),
        fecha_salida=datetime(2026, 4, 22, 0, 0, 0),
        total=320.0,
        nro_personas=2,
        id_usuario="user-1",
        id_pais="pais-1",
        id_habitacion="hab-1",
        id_estado="estado-1",
        id_cotizacion=None,
    )


def patch_app_config(monkeypatch):
    monkeypatch.setattr(app_module, "config", {"default": DummyConfig})


@pytest.fixture
def client(monkeypatch):
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, "init_redis_lock_service", lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(auth_module, "get_usuarios_auth_service", lambda: FakeAuthService())
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    return flask_app.test_client()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer fake-token"}


def valid_create_payload(**overrides):
    payload = {
        "fecha_ingreso": "2026-04-20T00:00:00",
        "fecha_salida": "2026-04-22T00:00:00",
        "nro_personas": 2,
        "id_usuario": "user-1",
        "id_pais": "pais-1",
        "id_habitacion": "hab-1",
        "id_estado": "estado-1",
    }
    payload.update(overrides)
    return payload


def test_create_reserva_returns_400_when_no_payload(client, auth_headers):
    response = client.post("/api/v1/reservas", headers=auth_headers, data="null", content_type="application/json")

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_create_reserva_returns_400_when_required_fields_missing(client, auth_headers):
    response = client.post("/api/v1/reservas", headers=auth_headers, json={"id_usuario": "user-1"})

    assert response.status_code == 400
    assert "All fields are required" in response.get_json()["error"]


def test_create_reserva_returns_400_when_nro_personas_invalid(client, auth_headers):
    payload = valid_create_payload(nro_personas="dos")

    response = client.post("/api/v1/reservas", headers=auth_headers, json=payload)

    assert response.status_code == 400
    assert response.get_json()["error"] == "nro_personas must be a positive integer"


def test_create_reserva_returns_404_when_cotizacion_not_found(client, auth_headers, monkeypatch):
    class FakeQuotationService:
        def get_quotation(self, _quote_id):
            return None

    monkeypatch.setattr(
        reservas_api,
        "get_pricing_services",
        lambda: (SimpleNamespace(), SimpleNamespace(), FakeQuotationService()),
    )

    payload = valid_create_payload(id_cotizacion="quote-1")
    response = client.post("/api/v1/reservas", headers=auth_headers, json=payload)

    assert response.status_code == 404
    assert response.get_json()["error"] == "Cotizacion not found"


def test_create_reserva_returns_429_when_redis_lock_not_acquired(client, auth_headers, monkeypatch):
    class FakePricingService:
        def calculate_stay(self, **_kwargs):
            return {
                "total": 320.0,
                "moneda": "USD",
                "detalle_noches": [],
            }

    class FakeLockContext:
        def __enter__(self):
            raise reservas_api.RedisLockAcquisitionError("busy")

        def __exit__(self, _exc_type, _exc, _tb):
            return False

    class FakeLockService:
        def room_hold_lock(self, *_args, **_kwargs):
            return FakeLockContext()

    monkeypatch.setattr(
        reservas_api,
        "get_pricing_services",
        lambda: (SimpleNamespace(), FakePricingService(), SimpleNamespace()),
    )
    monkeypatch.setattr(reservas_api, "get_lock_service", lambda: FakeLockService())

    payload = valid_create_payload()
    response = client.post("/api/v1/reservas", headers=auth_headers, json=payload)

    assert response.status_code == 429
    assert "another request" in response.get_json()["error"]


def test_create_reserva_returns_201_on_success(client, auth_headers, monkeypatch):
    class FakePricingService:
        def calculate_stay(self, **_kwargs):
            return {
                "total": 320.0,
                "moneda": "USD",
                "detalle_noches": [],
            }

    monkeypatch.setattr(
        reservas_api,
        "get_pricing_services",
        lambda: (SimpleNamespace(), FakePricingService(), SimpleNamespace()),
    )
    monkeypatch.setattr(reservas_api, "get_lock_service", lambda: None)
    monkeypatch.setattr(
        reservas_api,
        "_execute_reservation_creation",
        lambda *_args, **_kwargs: (reservas_api.jsonify({"id": "res-1"}), 201),
    )

    payload = valid_create_payload()
    response = client.post("/api/v1/reservas", headers=auth_headers, json=payload)

    assert response.status_code == 201
    assert response.get_json()["id"] == "res-1"


def test_get_reserva_returns_200(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        reservas_api,
        "GetReservaUseCase",
        lambda _repo: FixedResultUseCase(make_reserva("res-100")),
    )

    response = client.get("/api/v1/reservas/res-100", headers=auth_headers)

    assert response.status_code == 200
    assert response.get_json()["id"] == "res-100"


def test_get_reserva_returns_404_when_missing(client, auth_headers, monkeypatch):
    monkeypatch.setattr(reservas_api, "GetReservaUseCase", lambda _repo: FixedResultUseCase(None))

    response = client.get("/api/v1/reservas/not-found", headers=auth_headers)

    assert response.status_code == 404
    assert response.get_json()["error"] == "Reserva not found"


def test_get_all_reservas_returns_200(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        reservas_api,
        "GetAllReservasUseCase",
        lambda _repo: FixedResultUseCase([make_reserva("res-a"), make_reserva("res-b")]),
    )

    response = client.get("/api/v1/reservas", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.get_json()) == 2


def test_get_reservas_by_usuario_returns_200(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        reservas_api,
        "GetReservasByUsuarioUseCase",
        lambda _repo: FixedResultUseCase([make_reserva("res-u")]),
    )

    response = client.get("/api/v1/usuarios/user-1/reservas", headers=auth_headers)

    assert response.status_code == 200
    assert response.get_json()[0]["id"] == "res-u"


def test_get_recently_viewed_uses_default_limit_for_invalid_query(client, auth_headers, monkeypatch):
    observed = {"limit": None}

    class FakeRepository:
        def find_recently_viewed_enriched(self, _usuario_id, limit):
            observed["limit"] = limit
            return [{"id_reserva": "res-rv-1"}]

    monkeypatch.setattr(reservas_api, "get_repository", lambda: FakeRepository())

    response = client.get("/api/v1/usuarios/user-1/reservas/recently-viewed?limit=abc", headers=auth_headers)

    assert response.status_code == 200
    assert observed["limit"] == 3
    assert response.get_json()[0]["id_reserva"] == "res-rv-1"


def test_get_reservas_by_habitacion_returns_200(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        reservas_api,
        "GetReservasByHabitacionUseCase",
        lambda _repo: FixedResultUseCase([make_reserva("res-h")]),
    )

    response = client.get("/api/v1/habitaciones/hab-1/reservas", headers=auth_headers)

    assert response.status_code == 200
    assert response.get_json()[0]["id"] == "res-h"


def test_update_reserva_returns_400_when_no_payload(client, auth_headers):
    response = client.put("/api/v1/reservas/res-1", headers=auth_headers, data="null", content_type="application/json")

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_update_reserva_returns_404_when_missing(client, auth_headers, monkeypatch):
    monkeypatch.setattr(reservas_api, "GetReservaUseCase", lambda _repo: FixedResultUseCase(None))
    monkeypatch.setattr(reservas_api, "UpdateReservaUseCase", lambda _repo: FixedResultUseCase(None))

    response = client.put("/api/v1/reservas/not-found", headers=auth_headers, json={"total": 10})

    assert response.status_code == 404
    assert response.get_json()["error"] == "Reserva not found"


def test_update_reserva_sends_push_notification_when_confirmed(client, auth_headers, monkeypatch):
    """Test that push notification is sent when reserva estado is updated to confirmed."""
    push_called = {"called": False, "args": None}
    existing_reserva = make_reserva("res-1")
    updated_reserva = make_reserva("res-1")
    updated_reserva.id_estado = "estado-confirmado"

    class FakeEstado:
        def __init__(self, nombre):
            self.nombre = nombre

    class FakeEstadoRepository:
        def find_by_id(self, _estado_id):
            return FakeEstado("confirmada")

    class FakePushUseCase:
        def execute(self, user_id, title, body, data=None):
            push_called["called"] = True
            push_called["args"] = {
                "user_id": user_id,
                "title": title,
                "body": body,
                "data": data,
            }
            return {"success": True}

    monkeypatch.setattr(
        reservas_api,
        "GetReservaUseCase",
        lambda _repo: FixedResultUseCase(existing_reserva),
    )
    monkeypatch.setattr(
        reservas_api,
        "UpdateReservaUseCase",
        lambda _repo: FixedResultUseCase(updated_reserva),
    )
    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())
    monkeypatch.setattr(reservas_api, "get_push_notification_use_case", lambda: FakePushUseCase())

    response = client.put(
        "/api/v1/reservas/res-1",
        headers=auth_headers,
        json={"id_estado": "estado-confirmado"},
    )

    assert response.status_code == 200
    assert push_called["called"] is True
    assert push_called["args"]["title"] == "Reserva Confirmada"
    assert push_called["args"]["body"] == "Tu reserva ha sido confirmada exitosamente"
    assert push_called["args"]["data"]["type"] == "reservation_confirmed"
    assert push_called["args"]["data"]["reservation_id"] == "res-1"


def test_update_reserva_no_push_notification_when_not_confirmed(client, auth_headers, monkeypatch):
    """Test that push notification is NOT sent when reserva estado is not confirmed."""
    push_called = {"called": False}
    existing_reserva = make_reserva("res-1")
    updated_reserva = make_reserva("res-1")
    updated_reserva.id_estado = "estado-pendiente"

    class FakeEstado:
        def __init__(self, nombre):
            self.nombre = nombre

    class FakeEstadoRepository:
        def find_by_id(self, _estado_id):
            return FakeEstado("pendiente")

    class FakePushUseCase:
        def execute(self, reservation_id, title, body, data=None):
            push_called["called"] = True
            return {"success": True}

    monkeypatch.setattr(
        reservas_api,
        "GetReservaUseCase",
        lambda _repo: FixedResultUseCase(existing_reserva),
    )
    monkeypatch.setattr(
        reservas_api,
        "UpdateReservaUseCase",
        lambda _repo: FixedResultUseCase(updated_reserva),
    )
    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())
    monkeypatch.setattr(reservas_api, "get_push_notification_use_case", lambda: FakePushUseCase())

    response = client.put(
        "/api/v1/reservas/res-1",
        headers=auth_headers,
        json={"id_estado": "estado-pendiente"},
    )

    assert response.status_code == 200
    assert push_called["called"] is False


def test_update_reserva_no_push_notification_when_estado_not_updated(client, auth_headers, monkeypatch):
    """Test that push notification is NOT sent when estado is not in update_data."""
    push_called = {"called": False}
    existing_reserva = make_reserva("res-1")
    updated_reserva = make_reserva("res-1")

    class FakePushUseCase:
        def execute(self, reservation_id, title, body, data=None):
            push_called["called"] = True
            return {"success": True}

    monkeypatch.setattr(
        reservas_api,
        "GetReservaUseCase",
        lambda _repo: FixedResultUseCase(existing_reserva),
    )
    monkeypatch.setattr(
        reservas_api,
        "UpdateReservaUseCase",
        lambda _repo: FixedResultUseCase(updated_reserva),
    )
    monkeypatch.setattr(reservas_api, "get_push_notification_use_case", lambda: FakePushUseCase())

    response = client.put(
        "/api/v1/reservas/res-1",
        headers=auth_headers,
        json={"total": 400},
    )

    assert response.status_code == 200
    assert push_called["called"] is False


def test_delete_reserva_returns_200(client, auth_headers, monkeypatch):
    monkeypatch.setattr(reservas_api, "DeleteReservaUseCase", lambda _repo: FixedResultUseCase(True))

    response = client.delete("/api/v1/reservas/res-1", headers=auth_headers)

    assert response.status_code == 200
    assert response.get_json()["message"] == "Reserva deleted successfully"


def test_delete_reserva_returns_404_when_missing(client, auth_headers, monkeypatch):
    monkeypatch.setattr(reservas_api, "DeleteReservaUseCase", lambda _repo: FixedResultUseCase(False))

    response = client.delete("/api/v1/reservas/not-found", headers=auth_headers)

    assert response.status_code == 404
    assert response.get_json()["error"] == "Reserva not found"


def test_create_reserva_pms_webhook_returns_400_when_required_missing(client):
    response = client.post("/api/v1/reservas/webhook/pms", json={"id_usuario": "user-1"})

    assert response.status_code == 400
    assert "All fields are required" in response.get_json()["error"]


def test_create_reserva_pms_webhook_returns_409_on_overlap(client, monkeypatch):
    class FakeReservaRepository:
        def has_overlapping_confirmed_reservation(self, *_args, **_kwargs):
            return True

    class FakeEstadoRepository:
        def find_by_nombre(self, _nombre):
            return SimpleNamespace(id="estado-pms")

    monkeypatch.setattr(reservas_api, "get_repository", lambda: FakeReservaRepository())
    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())

    payload = {
        "fecha_ingreso": "2026-04-20T00:00:00",
        "fecha_salida": "2026-04-21T00:00:00",
        "total": 100,
        "nro_personas": 1,
        "id_usuario": "user-1",
        "id_pais": "pais-1",
        "id_habitacion": "hab-1",
    }
    response = client.post("/api/v1/reservas/webhook/pms", json=payload)

    assert response.status_code == 409
    assert "already reserved" in response.get_json()["error"]


def test_create_reserva_pms_webhook_returns_201(client, monkeypatch):
    class FakeReservaRepository:
        def has_overlapping_confirmed_reservation(self, *_args, **_kwargs):
            return False

    class FakeEstadoRepository:
        def find_by_nombre(self, _nombre):
            return SimpleNamespace(id="estado-pms")

    monkeypatch.setattr(reservas_api, "get_repository", lambda: FakeReservaRepository())
    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())
    monkeypatch.setattr(
        reservas_api,
        "CheckRoomHoldUseCase",
        lambda _repo: FixedResultUseCase(None),
    )
    monkeypatch.setattr(
        reservas_api,
        "AcquireRoomHoldUseCase",
        lambda _repo: FixedResultUseCase(SimpleNamespace(id="hold-pms")),
    )
    monkeypatch.setattr(
        reservas_api,
        "ReleaseRoomHoldUseCase",
        lambda _repo: FixedResultUseCase(True),
    )
    monkeypatch.setattr(
        reservas_api,
        "CreateReservaUseCase",
        lambda _repo: FixedResultUseCase(make_reserva("res-pms")),
    )

    payload = {
        "fecha_ingreso": "2026-04-20T00:00:00",
        "fecha_salida": "2026-04-21T00:00:00",
        "total": 100,
        "nro_personas": 1,
        "id_usuario": "user-1",
        "id_pais": "pais-1",
        "id_habitacion": "hab-1",
    }
    response = client.post("/api/v1/reservas/webhook/pms", json=payload)

    assert response.status_code == 201
    assert response.get_json()["id"] == "res-pms"
    assert response.get_json()["source"] == "PMS"


def test_payment_webhook_returns_400_when_no_payload(client):
    response = client.post("/api/v1/payments/webhook", data="null", content_type="application/json")

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_payment_webhook_returns_400_when_required_fields_missing(client):
    response = client.post("/api/v1/payments/webhook", json={"status": "completado"})

    assert response.status_code == 400
    assert "payment_intent_id and status are required" == response.get_json()["error"]


def test_payment_webhook_non_completed_status_returns_200(client, monkeypatch):
    published = {"called": False}

    class FakeEvent:
        def to_dict(self):
            return {"ok": True}

    class FakeEventType:
        @staticmethod
        def create(**_kwargs):
            return FakeEvent()

    class FakePublisher:
        def publish_payment_status_updated(self, _payload):
            published["called"] = True

    class FakePublisherType:
        @staticmethod
        def from_config():
            return FakePublisher()

    monkeypatch.setattr(reservas_api, "PaymentStatusUpdatedEvent", FakeEventType)
    monkeypatch.setattr(reservas_api, "MessagePublisher", FakePublisherType)

    response = client.post(
        "/api/v1/payments/webhook",
        json={
            "payment_intent_id": "pi-1",
            "status": "pendiente",
            "reservation_id": "res-1",
            "amount": 100,
            "currency": "USD",
        },
    )

    assert response.status_code == 200
    assert published["called"] is True


def test_payment_webhook_completed_returns_400_without_reservation_id(client):
    response = client.post(
        "/api/v1/payments/webhook",
        json={
            "payment_intent_id": "pi-1",
            "status": "completado",
        },
    )

    assert response.status_code == 400
    assert "reservation_id is required" in response.get_json()["error"]


def test_payment_webhook_completed_returns_404_when_reservation_missing(client, monkeypatch):
    class FakeEstadoRepository:
        def find_by_nombre(self, _nombre):
            return SimpleNamespace(id="estado-paid")

    class FakeReservaRepository:
        def find_by_id(self, _reserva_id):
            return None

    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())
    monkeypatch.setattr(reservas_api, "get_repository", lambda: FakeReservaRepository())

    response = client.post(
        "/api/v1/payments/webhook",
        json={
            "payment_intent_id": "pi-1",
            "status": "completado",
            "reservation_id": "res-missing",
        },
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Reservation not found"


def test_payment_webhook_completed_returns_200(client, monkeypatch):
    updated = {"called": False}
    published = {"called": False}
    reserva = make_reserva("res-ok")

    class FakeEstadoRepository:
        def find_by_nombre(self, _nombre):
            return SimpleNamespace(id="estado-paid")

    class FakeReservaRepository:
        def find_by_id(self, _reserva_id):
            return reserva

        def update(self, _reserva):
            updated["called"] = True
            return _reserva

    class FakeEvent:
        def to_dict(self):
            return {"ok": True}

    class FakeEventType:
        @staticmethod
        def create(**_kwargs):
            return FakeEvent()

    class FakePublisher:
        def publish_payment_status_updated(self, _payload):
            published["called"] = True

    class FakePublisherType:
        @staticmethod
        def from_config():
            return FakePublisher()

    monkeypatch.setattr(reservas_api, "SQLAlchemyEstadoRepository", lambda: FakeEstadoRepository())
    monkeypatch.setattr(reservas_api, "get_repository", lambda: FakeReservaRepository())
    monkeypatch.setattr(reservas_api, "PaymentStatusUpdatedEvent", FakeEventType)
    monkeypatch.setattr(reservas_api, "MessagePublisher", FakePublisherType)
    monkeypatch.setattr(reservas_api, "_ensure_completed_payment_record", lambda *_args, **_kwargs: None)

    response = client.post(
        "/api/v1/payments/webhook",
        json={
            "payment_intent_id": "pi-1",
            "status": "completado",
            "reservation_id": "res-ok",
            "amount": 320,
            "currency": "USD",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["reservation_id"] == "res-ok"
    assert updated["called"] is True
    assert published["called"] is True