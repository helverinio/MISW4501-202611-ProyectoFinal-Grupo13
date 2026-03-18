from app import db
from datetime import datetime

class PaymentModel(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True)
    external_payment_id = db.Column(db.String(36), nullable=True)
    payment_intent_id = db.Column(db.String(36), nullable=False)
    reservation_id = db.Column(db.String(36), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pendiente')
    payment_method = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'external_payment_id': self.external_payment_id,
            'payment_intent_id': self.payment_intent_id,
            'reservation_id': self.reservation_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
