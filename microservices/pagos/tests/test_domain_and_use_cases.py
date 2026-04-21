from dataclasses import replace

from app.application.use_cases.payment_use_cases import (
    GetPaymentUseCase,
    ProcessPaymentUseCase,
    RegisterPaymentUseCase,
    UpdatePaymentStatusUseCase,
)
from app.domain.entities.payment import Payment


class InMemoryPaymentRepo:
    def __init__(self):
        self.by_id = {}

    def find_all(self):
        return list(self.by_id.values())

    def save(self, payment):
        self.by_id[payment.id] = payment
        return payment

    def find_by_id(self, payment_id):
        return self.by_id.get(payment_id)

    def find_by_external_id(self, external_payment_id):
        for p in self.by_id.values():
            if p.external_payment_id == external_payment_id:
                return p
        return None

    def find_by_reservation_id(self, reservation_id):
        for p in self.by_id.values():
            if p.reservation_id == reservation_id:
                return p
        return None

    def find_by_payment_intent_id(self, payment_intent_id):
        for p in self.by_id.values():
            if p.payment_intent_id == payment_intent_id:
                return p
        return None

    def update_status(self, payment_id, status):
        p = self.by_id.get(payment_id)
        if not p:
            return None
        updated = replace(p, status=status)
        self.by_id[payment_id] = updated
        return updated

    def update_status_by_intent(self, payment_intent_id, status):
        p = self.find_by_payment_intent_id(payment_intent_id)
        if not p:
            return None
        updated = replace(p, status=status)
        self.by_id[p.id] = updated
        return updated

    def try_lock_for_processing(self, payment_id):
        p = self.by_id.get(payment_id)
        if not p or p.status != "pendiente":
            return None
        locked = replace(p, status="procesando")
        self.by_id[payment_id] = locked
        return locked

    def find_stale_pending(self, minutes):
        return []

    def mark_as_abandoned(self, payment_id):
        return None


class FakeExternalService:
    def __init__(self):
        self.intent_response = {"id": "intent-123"}
        self.make_payment_response = {"id": "ext-pay-1", "status": "completed"}
        self.external_payment = {"id": "ext-pay-1", "status": "completed"}

    def create_payment_intent(self, amount, currency, description=None, webhook_url=None, reservation_id=None):
        return self.intent_response

    def make_payment(self, payment_intent_id, payment_method):
        return self.make_payment_response

    def get_payment(self, payment_id):
        return self.external_payment


def _sample_payment(status="pendiente"):
    return Payment.create(
        payment_intent_id="intent-123",
        reservation_id="res-1",
        amount=100,
        currency="USD",
        payment_method="card",
        status=status,
    )


def test_payment_entity_create_defaults():
    payment = _sample_payment()

    assert payment.id
    assert payment.status == "pendiente"
    assert payment.created_at is not None
    assert payment.updated_at is not None


def test_register_payment_success():
    repo = InMemoryPaymentRepo()
    external = FakeExternalService()
    use_case = RegisterPaymentUseCase(repo, external, "http://gateway:8080")

    result = use_case.execute("res-1", 120, "USD", "card", "test")

    assert "error" not in result
    assert result["reservation_id"] == "res-1"
    assert result["status"] == "pendiente"



def test_process_payment_paths():
    repo = InMemoryPaymentRepo()
    external = FakeExternalService()
    use_case = ProcessPaymentUseCase(repo, external)

    not_found = use_case.execute("missing")
    assert not_found["error"] == "Payment not found"

    not_pending_payment = _sample_payment(status="pagado")
    repo.save(not_pending_payment)
    not_pending = use_case.execute(not_pending_payment.id)
    assert "not in pendiente status" in not_pending["error"]

    locked_payment = _sample_payment(status="pendiente")
    repo.save(locked_payment)
    external.make_payment_response = {"error": "gateway timeout"}
    external_error = use_case.execute(locked_payment.id)
    assert external_error["error"] == "gateway timeout"

    repo.update_status(locked_payment.id, "pendiente")
    external.make_payment_response = {"id": "ext-pay-2", "status": "processing"}
    success = use_case.execute(locked_payment.id)
    assert success["id"] == locked_payment.id
    assert "message" in success


def test_update_payment_status_and_get_payment_use_cases():
    repo = InMemoryPaymentRepo()
    payment = _sample_payment()
    repo.save(payment)

    update_case = UpdatePaymentStatusUseCase(repo)
    updated = update_case.execute(payment.payment_intent_id, "completado")
    assert updated is not None
    assert updated["status"] == "completado"

    not_updated = update_case.execute("missing-intent", "completado")
    assert not_updated is None

    external = FakeExternalService()
    get_case = GetPaymentUseCase(repo, external)

    repo.by_id[payment.id] = replace(repo.by_id[payment.id], external_payment_id="ext-pay-1")

    fetched = get_case.execute(payment.id)
    assert fetched is not None
    assert fetched["external_payment_details"]["id"] == "ext-pay-1"

    repo.by_id[payment.id] = replace(repo.by_id[payment.id], external_payment_id=None)
    fetched_without_external = get_case.execute(payment.id)
    assert fetched_without_external["external_payment_details"] is None

    missing = get_case.execute("missing")
    assert missing is None
