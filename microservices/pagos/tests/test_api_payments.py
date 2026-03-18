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


class FakeRegisterPaymentUseCase:
    def __init__(self, repository, external_service, webhook_base_url):
        self.repository = repository
        self.external_service = external_service
        self.webhook_base_url = webhook_base_url

    def execute(self, reservation_id, amount, currency, payment_method, description=None):
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

    def execute(self, payment_id):
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

    monkeypatch.setattr(subscriber_module.PaymentStatusSubscriber, "start", lambda self: None)
    monkeypatch.setattr(scheduler_module.PaymentAbandonmentScheduler, "start", lambda self: None)

    monkeypatch.setattr(payments_module, "RegisterPaymentUseCase", FakeRegisterPaymentUseCase)
    monkeypatch.setattr(payments_module, "ProcessPaymentUseCase", FakeProcessPaymentUseCase)
    monkeypatch.setattr(payments_module, "UpdatePaymentStatusUseCase", FakeUpdatePaymentStatusUseCase)
    monkeypatch.setattr(payments_module, "GetPaymentUseCase", FakeGetPaymentUseCase)
    monkeypatch.setattr(payments_module, "get_repository", lambda: FakeRepository())
    monkeypatch.setattr(payments_module, "get_external_service", lambda: FakeExternalService())

    app = app_module.create_app("default")
    app.config.update(TESTING=True)
    return app.test_client()


def test_register_payment_validations_and_success(client):
    no_data = client.post("/api/v1/payments", json={})
    assert no_data.status_code == 400

    missing_fields = client.post("/api/v1/payments", json={"reservation_id": "r1"})
    assert missing_fields.status_code == 400

    use_case_error = client.post(
        "/api/v1/payments",
        json={"reservation_id": "bad", "amount": 100, "payment_method": "card"},
    )
    assert use_case_error.status_code == 400

    success = client.post(
        "/api/v1/payments",
        json={"reservation_id": "res-1", "amount": 100, "payment_method": "card"},
    )
    assert success.status_code == 201
    assert success.get_json()["id"] == "pay-1"


def test_process_payment_path(client):
    fail = client.post("/api/v1/payments/bad/process")
    assert fail.status_code == 400

    ok = client.post("/api/v1/payments/pay-1/process")
    assert ok.status_code == 200


def test_payment_webhook_paths(client):
    no_data = client.post("/api/v1/payments/webhook", json={})
    assert no_data.status_code == 400

    missing_fields = client.post("/api/v1/payments/webhook", json={"payment_intent_id": "i-1"})
    assert missing_fields.status_code == 400

    not_found = client.post(
        "/api/v1/payments/webhook",
        json={"payment_intent_id": "missing", "status": "completado"},
    )
    assert not_found.status_code == 404

    ok = client.post(
        "/api/v1/payments/webhook",
        json={"payment_intent_id": "intent-1", "status": "completado"},
    )
    assert ok.status_code == 200


def test_get_payment_and_lists(client):
    not_found = client.get("/api/v1/payments/missing")
    assert not_found.status_code == 404

    payment = client.get("/api/v1/payments/pay-1")
    assert payment.status_code == 200
    assert payment.get_json()["id"] == "pay-1"

    all_payments = client.get("/api/v1/payments")
    assert all_payments.status_code == 200
    assert len(all_payments.get_json()) == 2

    by_reservation_not_found = client.get("/api/v1/payments/reservation/missing")
    assert by_reservation_not_found.status_code == 404

    by_reservation_ok = client.get("/api/v1/payments/reservation/res-1")
    assert by_reservation_ok.status_code == 200
    assert by_reservation_ok.get_json()["reservation_id"] == "res-1"
