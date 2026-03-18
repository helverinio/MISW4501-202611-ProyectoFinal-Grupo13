from dataclasses import replace

from app.application.use_cases.payment_use_cases import (
    CreatePaymentIntentUseCase,
    GetPaymentUseCase,
    MakePaymentUseCase,
)
from app.domain.entities.payment import Payment, PaymentIntent


class InMemoryIntentRepository:
    def __init__(self):
        self.data = {}

    def save(self, payment_intent):
        self.data[payment_intent.id] = payment_intent
        return payment_intent

    def find_by_id(self, intent_id):
        return self.data.get(intent_id)

    def update_status(self, intent_id, status):
        intent = self.data.get(intent_id)
        if not intent:
            return None
        updated = replace(intent, status=status)
        self.data[intent_id] = updated
        return updated


class InMemoryPaymentRepository:
    def __init__(self):
        self.data = {}

    def save(self, payment):
        self.data[payment.id] = payment
        return payment

    def find_by_id(self, payment_id):
        return self.data.get(payment_id)


def test_create_payment_intent_use_case_stores_intent():
    intent_repo = InMemoryIntentRepository()
    use_case = CreatePaymentIntentUseCase(intent_repo)

    intent = use_case.execute(
        amount=100,
        currency="USD",
        description="test",
        webhook_url="https://example.com/webhook",
        reservation_id="res-1",
    )

    assert intent.id in intent_repo.data
    assert intent.status == "pending"
    assert intent.reservation_id == "res-1"


def test_make_payment_returns_none_when_intent_not_found():
    intent_repo = InMemoryIntentRepository()
    payment_repo = InMemoryPaymentRepository()

    use_case = MakePaymentUseCase(payment_repo, intent_repo)

    result = use_case.execute("missing-intent", "card")

    assert result is None


def test_make_payment_returns_none_when_intent_not_pending():
    intent_repo = InMemoryIntentRepository()
    payment_repo = InMemoryPaymentRepository()

    completed_intent = PaymentIntent.create(amount=90, currency="USD")
    completed_intent = replace(completed_intent, status="completed")
    intent_repo.save(completed_intent)

    use_case = MakePaymentUseCase(payment_repo, intent_repo)

    result = use_case.execute(completed_intent.id, "card")

    assert result is None


def test_make_payment_success_and_get_payment_use_case():
    intent_repo = InMemoryIntentRepository()
    payment_repo = InMemoryPaymentRepository()

    pending_intent = PaymentIntent.create(amount=110, currency="USD")
    intent_repo.save(pending_intent)

    use_case = MakePaymentUseCase(payment_repo, intent_repo)
    created_payment = use_case.execute(pending_intent.id, "card")

    assert created_payment is not None
    assert created_payment.status == "completed"

    get_use_case = GetPaymentUseCase(payment_repo)
    fetched = get_use_case.execute(created_payment.id)

    assert fetched is not None
    assert fetched.id == created_payment.id


def test_notify_webhook_handles_request_exception(monkeypatch):
    class BoomRequestException(Exception):
        pass

    def fake_post(*args, **kwargs):
        raise BoomRequestException("network error")

    payment_repo = InMemoryPaymentRepository()
    intent_repo = InMemoryIntentRepository()
    use_case = MakePaymentUseCase(payment_repo, intent_repo)

    monkeypatch.setattr("app.application.use_cases.payment_use_cases.requests.post", fake_post)
    monkeypatch.setattr(
        "app.application.use_cases.payment_use_cases.requests.RequestException",
        BoomRequestException,
    )

    # Should not raise, because errors are handled internally.
    use_case._notify_webhook(
        webhook_url="https://example.com/webhook",
        payment_intent_id="intent-1",
        status="completado",
        reservation_id="res-1",
        amount=100,
        currency="USD",
    )
