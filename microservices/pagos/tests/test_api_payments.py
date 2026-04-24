import pytest


class FixedDate:
    def isoformat(self):
        return "2026-01-01T00:00:00"


class DummyPayment:
    def __init__(self, payment_id="pay-1", payment_intent_id="intent-1", reservation_id="res-1", status="pendiente"):
        self.id = payment_id
        self.external_payment_id = "ext-1"
        self.payment_intent_id = payment_intent_id
        self.reservation_id = reservation_id
        self.amount = 100
        self.currency = "USD"
        self.status = status
        self.payment_method = "card"
        self.created_at = FixedDate()
        self.updated_at = FixedDate()


class DummyConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    EXT_PAYMENTS_URL = "http://localhost:5001"
    PAGOS_WEBHOOK_URL = "http://gateway:5000"


LAST_REGISTER_CALL = {}
LAST_PROCESS_CALL = {}


class FakeRegisterPaymentUseCase:
    def __init__(self, repository, external_service, webhook_base_url):
        self.repository = repository
        self.external_service = external_service
        self.webhook_base_url = webhook_base_url

    def execute(self, reservation_id, amount, currency, payment_method, description=None):
        LAST_REGISTER_CALL["args"] = {
            "reservation_id": reservation_id,
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method,
            "description": description,
            "webhook_base_url": self.webhook_base_url,
        }
        if reservation_id == "bad":
            return {"error": "invalid reservation"}
        return {
            "id": "pay-1",
            "payment_intent_id": "intent-1",
            "reservation_id": reservation_id,
            "amount": amount,
            "currency": currency,
            "status": "pendiente",
            "payment_method": payment_method,
            "created_at": "2026-01-01T00:00:00",
            "updated_at": "2026-01-01T00:00:00",
        }


class FakeProcessPaymentUseCase:
    def __init__(self, repository, external_service):
        self.repository = repository
        self.external_service = external_service

    def execute(self, payment_id, payment_method=None):
        LAST_PROCESS_CALL["args"] = {
            "payment_id": payment_id,
            "payment_method": payment_method,
        }
        if payment_id == "bad":
            return {"error": "cannot process"}
        return {"id": payment_id, "status": "procesando"}


class FakeUpdatePaymentStatusUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, payment_intent_id, status):
        if payment_intent_id == "missing":
            return None
        return {
            "id": "pay-1",
            "payment_intent_id": payment_intent_id,
            "reservation_id": "res-1",
            "amount": 100,
            "currency": "USD",
            "status": status,
            "payment_method": "card",
            "created_at": "2026-01-01T00:00:00",
            "updated_at": "2026-01-01T00:00:00",
        }


class FakeGetPaymentUseCase:
    def __init__(self, repository, external_service):
        self.repository = repository
        self.external_service = external_service

    def execute(self, payment_id):
        if payment_id == "missing":
            return None
        return {"id": payment_id, "status": "pendiente"}


class FakeRepository:
    def find_all(self):
        return [DummyPayment(), DummyPayment(payment_id="pay-2", reservation_id="res-2")]

    def find_by_reservation_id(self, reservation_id):
        if reservation_id == "missing":
            return None
        return DummyPayment(reservation_id=reservation_id)


class FakeExternalService:
    pass


@pytest.fixture
def client(monkeypatch):
    import app as app_module
    import app.api.v1.payments as payments_module
    import app.infrastructure.messaging.subscriber as subscriber_module
    import app.infrastructure.services.payment_abandonment_scheduler as scheduler_module

    monkeypatch.setattr(app_module, "config", {"default": DummyConfig})

    monkeypatch.setattr(subscriber_module.PaymentStatusSubscriber, "start", lambda self: None)
    monkeypatch.setattr(scheduler_module.PaymentAbandonmentScheduler, "start", lambda self: None)

    monkeypatch.setattr(payments_module, "RegisterPaymentUseCase", FakeRegisterPaymentUseCase)
    monkeypatch.setattr(payments_module, "ProcessPaymentUseCase", FakeProcessPaymentUseCase)
    monkeypatch.setattr(payments_module, "UpdatePaymentStatusUseCase", FakeUpdatePaymentStatusUseCase)
    monkeypatch.setattr(payments_module, "GetPaymentUseCase", FakeGetPaymentUseCase)
    monkeypatch.setattr(payments_module, "get_repository", lambda: FakeRepository())
    monkeypatch.setattr(payments_module, "get_external_service", lambda: FakeExternalService())
    monkeypatch.setattr(payments_module, "get_webhook_base_url", lambda: "http://gateway:5000")

    app = app_module.create_app("default")
    app.config.update(TESTING=True)
    return app.test_client()


def test_register_payment_returns_400_when_no_data(client):
    response = client.post("/api/v1/payments", json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_register_payment_returns_400_when_fields_missing(client):
    response = client.post("/api/v1/payments", json={"reservation_id": "res-1"})

    assert response.status_code == 400
    assert "required" in response.get_json()["error"]


def test_register_payment_returns_400_when_use_case_fails(client):
    response = client.post(
        "/api/v1/payments",
        json={"reservation_id": "bad", "amount": 100, "payment_method": "card"},
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "invalid reservation"


def test_register_payment_returns_201_and_uses_default_currency(client):
    LAST_REGISTER_CALL.clear()

    response = client.post(
        "/api/v1/payments",
        json={
            "reservation_id": "res-1",
            "amount": 100,
            "payment_method": "card",
            "description": "Pago reserva",
        },
    )

    assert response.status_code == 201
    assert response.get_json()["id"] == "pay-1"
    assert LAST_REGISTER_CALL["args"]["currency"] == "USD"
    assert LAST_REGISTER_CALL["args"]["description"] == "Pago reserva"
    assert LAST_REGISTER_CALL["args"]["webhook_base_url"] == "http://gateway:5000"


def test_process_payment_returns_400_when_use_case_fails(client):
    response = client.post("/api/v1/payments/bad/process")

    assert response.status_code == 400
    assert response.get_json()["error"] == "cannot process"


def test_process_payment_returns_200_and_forwards_payment_method(client):
    LAST_PROCESS_CALL.clear()

    response = client.post("/api/v1/payments/pay-1/process", json={"payment_method": "pse"})

    assert response.status_code == 200
    assert response.get_json()["id"] == "pay-1"
    assert LAST_PROCESS_CALL["args"]["payment_method"] == "pse"


def test_payment_webhook_returns_400_when_no_data(client):
    response = client.post("/api/v1/payments/webhook", json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No data provided"


def test_payment_webhook_returns_400_when_fields_missing(client):
    response = client.post("/api/v1/payments/webhook", json={"payment_intent_id": "intent-1"})

    assert response.status_code == 400
    assert "required" in response.get_json()["error"]


def test_payment_webhook_returns_404_when_payment_not_found(client):
    response = client.post(
        "/api/v1/payments/webhook",
        json={"payment_intent_id": "missing", "status": "completado"},
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Payment not found"


def test_payment_webhook_returns_200_when_status_updated(client):
    response = client.post(
        "/api/v1/payments/webhook",
        json={"payment_intent_id": "intent-1", "status": "completado"},
    )

    assert response.status_code == 200
    assert response.get_json()["payment_intent_id"] == "intent-1"


def test_get_payment_returns_404_when_missing(client):
    response = client.get("/api/v1/payments/missing")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Payment not found"


def test_get_payment_returns_200_when_exists(client):
    response = client.get("/api/v1/payments/pay-1")

    assert response.status_code == 200
    assert response.get_json()["id"] == "pay-1"


def test_get_all_payments_returns_200(client):
    response = client.get("/api/v1/payments")

    assert response.status_code == 200
    body = response.get_json()
    assert len(body) == 2
    assert body[0]["id"] == "pay-1"


def test_get_payment_by_reservation_returns_404_when_missing(client):
    response = client.get("/api/v1/payments/reservation/missing")

    assert response.status_code == 404
    assert response.get_json()["error"] == "Payment not found for reservation"


def test_get_payment_by_reservation_returns_200_when_exists(client):
    response = client.get("/api/v1/payments/reservation/res-1")

    assert response.status_code == 200
    assert response.get_json()["reservation_id"] == "res-1"
