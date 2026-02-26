from typing import Optional
from app import db
from app.domain.entities.payment import Payment, PaymentIntent
from app.domain.repositories.payment_repository import PaymentRepository, PaymentIntentRepository
from app.infrastructure.models.payment_model import PaymentModel, PaymentIntentModel

class SQLAlchemyPaymentIntentRepository(PaymentIntentRepository):
    def save(self, payment_intent: PaymentIntent) -> PaymentIntent:
        model = PaymentIntentModel(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            description=payment_intent.description,
            status=payment_intent.status,
            webhook_url=payment_intent.webhook_url,
            created_at=payment_intent.created_at
        )
        db.session.add(model)
        db.session.commit()
        return payment_intent
    
    def find_by_id(self, intent_id: str) -> Optional[PaymentIntent]:
        model = PaymentIntentModel.query.get(intent_id)
        if not model:
            return None
        return self._to_entity(model)
    
    def update_status(self, intent_id: str, status: str) -> Optional[PaymentIntent]:
        model = PaymentIntentModel.query.get(intent_id)
        if model:
            model.status = status
            db.session.commit()
            return self._to_entity(model)
        return None
    
    def _to_entity(self, model: PaymentIntentModel) -> PaymentIntent:
        return PaymentIntent(
            id=model.id,
            amount=model.amount,
            currency=model.currency,
            description=model.description,
            status=model.status,
            webhook_url=model.webhook_url,
            created_at=model.created_at
        )

class SQLAlchemyPaymentRepository(PaymentRepository):
    def save(self, payment: Payment) -> Payment:
        model = PaymentModel(
            id=payment.id,
            payment_intent_id=payment.payment_intent_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            payment_method=payment.payment_method,
            created_at=payment.created_at,
            updated_at=payment.updated_at
        )
        db.session.add(model)
        db.session.commit()
        return payment
    
    def find_by_id(self, payment_id: str) -> Optional[Payment]:
        model = PaymentModel.query.get(payment_id)
        if not model:
            return None
        return self._to_entity(model)
    
    def _to_entity(self, model: PaymentModel) -> Payment:
        return Payment(
            id=model.id,
            payment_intent_id=model.payment_intent_id,
            amount=model.amount,
            currency=model.currency,
            status=model.status,
            payment_method=model.payment_method,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
