from app.domain.entities.payment import Payment, PaymentIntent


def test_payment_intent_create_defaults():
    intent = PaymentIntent.create(amount=120.5, currency="USD")

    assert intent.id
    assert intent.amount == 120.5
    assert intent.currency == "USD"
    assert intent.status == "pending"
    assert intent.created_at is not None


def test_payment_create_defaults():
    payment = Payment.create(
        payment_intent_id="intent-1",
        amount=120.5,
        currency="USD",
        payment_method="card",
    )

    assert payment.id
    assert payment.payment_intent_id == "intent-1"
    assert payment.amount == 120.5
    assert payment.currency == "USD"
    assert payment.status == "completed"
    assert payment.payment_method == "card"
    assert payment.created_at is not None
    assert payment.updated_at is not None
