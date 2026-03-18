from app import create_app


class DummyIntent:
    def __init__(self, intent_id, amount, currency, description, status, webhook_url, reservation_id, created_at):
        self.id = intent_id
        self.amount = amount
        self.currency = currency
        self.description = description
        self.status = status
        self.webhook_url = webhook_url
        self.reservation_id = reservation_id
        self.created_at = created_at


class DummyPayment:
    def __init__(self, payment_id, payment_intent_id, amount, currency, status, payment_method, created_at, updated_at):
        self.id = payment_id
        self.payment_intent_id = payment_intent_id
        self.amount = amount
        self.currency = currency
        self.status = status
        self.payment_method = payment_method
        self.created_at = created_at
        self.updated_at = updated_at


class FixedDate:
    def isoformat(self):
        return "2026-01-01T00:00:00"


class FakeCreatePaymentIntentUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, amount, currency, description, webhook_url, reservation_id):
        return DummyIntent(
            intent_id="intent-123",
            amount=amount,
            currency=currency,
            description=description,
            status="pending",
            webhook_url=webhook_url,
            reservation_id=reservation_id,
            created_at=FixedDate(),
        )


class FakeMakePaymentUseCase:
    def __init__(self, payment_repo, intent_repo):
        self.payment_repo = payment_repo
        self.intent_repo = intent_repo

    def execute(self, payment_intent_id, payment_method):
        if payment_intent_id == "missing":
            return None
        return DummyPayment(
            payment_id="payment-123",
            payment_intent_id=payment_intent_id,
            amount=100,
            currency="USD",
            status="completed",
            payment_method=payment_method,
            created_at=FixedDate(),
            updated_at=FixedDate(),
        )


class FakeGetPaymentUseCase:
    def __init__(self, payment_repo):
        self.payment_repo = payment_repo

    def execute(self, payment_id):
        if payment_id == "missing":
            return None
        return DummyPayment(
            payment_id=payment_id,
            payment_intent_id="intent-123",
            amount=100,
            currency="USD",
            status="completed",
            payment_method="card",
            created_at=FixedDate(),
            updated_at=FixedDate(),
        )


def _build_client(monkeypatch):
    import app.api.v1.payments as payments_module

    monkeypatch.setattr(payments_module, "CreatePaymentIntentUseCase", FakeCreatePaymentIntentUseCase)
    monkeypatch.setattr(payments_module, "MakePaymentUseCase", FakeMakePaymentUseCase)
    monkeypatch.setattr(payments_module, "GetPaymentUseCase", FakeGetPaymentUseCase)

    app = create_app("default")
    app.config.update(TESTING=True)
    return app.test_client()


def test_api_health(monkeypatch):
    client = _build_client(monkeypatch)

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["service"] == "ext-payments"


def test_create_payment_intent_validation_and_success(monkeypatch):
    client = _build_client(monkeypatch)

    no_data = client.post("/api/v1/payment-intents", json={})
    assert no_data.status_code == 400

    missing_amount = client.post("/api/v1/payment-intents", json={"currency": "USD"})
    assert missing_amount.status_code == 400

    ok = client.post(
        "/api/v1/payment-intents",
        json={
            "amount": 100,
            "currency": "USD",
            "description": "Reserva hotel",
            "webhook_url": "https://example.com/webhook",
            "reservation_id": "res-1",
        },
    )
    assert ok.status_code == 201
    body = ok.get_json()
    assert body["id"] == "intent-123"
    assert body["amount"] == 100


def test_make_payment_validation_not_found_and_success(monkeypatch):
    client = _build_client(monkeypatch)

    no_data = client.post("/api/v1/payments", json={})
    assert no_data.status_code == 400

    missing_fields = client.post("/api/v1/payments", json={"payment_intent_id": "x"})
    assert missing_fields.status_code == 400

    not_found = client.post(
        "/api/v1/payments",
        json={"payment_intent_id": "missing", "payment_method": "card"},
    )
    assert not_found.status_code == 400

    ok = client.post(
        "/api/v1/payments",
        json={"payment_intent_id": "intent-123", "payment_method": "card"},
    )
    assert ok.status_code == 201
    body = ok.get_json()
    assert body["id"] == "payment-123"


def test_get_payment_not_found_and_success(monkeypatch):
    client = _build_client(monkeypatch)

    not_found = client.get("/api/v1/payments/missing")
    assert not_found.status_code == 404

    ok = client.get("/api/v1/payments/payment-123")
    assert ok.status_code == 200
    body = ok.get_json()
    assert body["id"] == "payment-123"
