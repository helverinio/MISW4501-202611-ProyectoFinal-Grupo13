from typing import Optional, List
from datetime import datetime, timedelta
from app import db
from app.domain.entities.payment import Payment
from app.domain.repositories.payment_repository import PaymentRepository
from app.infrastructure.models.payment_model import PaymentModel

class SQLAlchemyPaymentRepository(PaymentRepository):
    def find_all(self) -> List[Payment]:
        models = PaymentModel.query.all()
        return [self._to_entity(model) for model in models]
    
    def save(self, payment: Payment) -> Payment:
        model = PaymentModel(
            id=payment.id,
            external_payment_id=payment.external_payment_id,
            payment_intent_id=payment.payment_intent_id,
            reservation_id=payment.reservation_id,
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
    
    def find_by_external_id(self, external_payment_id: str) -> Optional[Payment]:
        model = PaymentModel.query.filter_by(external_payment_id=external_payment_id).first()
        if not model:
            return None
        return self._to_entity(model)
    
    def find_by_reservation_id(self, reservation_id: str) -> Optional[Payment]:
        model = PaymentModel.query.filter_by(reservation_id=reservation_id).first()
        if not model:
            return None
        return self._to_entity(model)
    
    def find_by_payment_intent_id(self, payment_intent_id: str) -> Optional[Payment]:
        model = PaymentModel.query.filter_by(payment_intent_id=payment_intent_id).first()
        if not model:
            return None
        return self._to_entity(model)
    
    def update_status(self, payment_id: str, status: str) -> Optional[Payment]:
        model = PaymentModel.query.get(payment_id)
        if model:
            model.status = status
            db.session.commit()
            return self._to_entity(model)
        return None
    
    def update_status_by_intent(self, payment_intent_id: str, status: str) -> Optional[Payment]:
        model = PaymentModel.query.filter_by(payment_intent_id=payment_intent_id).first()
        if model:
            model.status = status
            db.session.commit()
            return self._to_entity(model)
        return None

    def update_payment_method(self, payment_id: str, payment_method: str) -> Optional[Payment]:
        model = PaymentModel.query.get(payment_id)
        if model:
            model.payment_method = payment_method
            db.session.commit()
            return self._to_entity(model)
        return None
    
    def try_lock_for_processing(self, payment_id: str) -> Optional[Payment]:
        rows_updated = PaymentModel.query.filter_by(
            id=payment_id, 
            status='pendiente'
        ).update({'status': 'procesando'})
        db.session.commit()
        
        if rows_updated == 0:
            return None
        
        model = PaymentModel.query.get(payment_id)
        return self._to_entity(model) if model else None
    
    def find_stale_pending(self, minutes: int) -> List[Payment]:
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        models = PaymentModel.query.filter(
            PaymentModel.status == 'pendiente',
            PaymentModel.created_at < cutoff_time
        ).all()
        return [self._to_entity(model) for model in models]
    
    def mark_as_abandoned(self, payment_id: str) -> Optional[Payment]:
        model = PaymentModel.query.get(payment_id)
        if model and model.status == 'pendiente':
            model.status = 'abandonado'
            model.updated_at = datetime.utcnow()
            db.session.commit()
            return self._to_entity(model)
        return None
    
    def _to_entity(self, model: PaymentModel) -> Payment:
        return Payment(
            id=model.id,
            external_payment_id=model.external_payment_id,
            payment_intent_id=model.payment_intent_id,
            reservation_id=model.reservation_id,
            amount=model.amount,
            currency=model.currency,
            status=model.status,
            payment_method=model.payment_method,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
