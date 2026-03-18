from app import db
from datetime import datetime

class PaymentIntentModel(db.Model):
    __tablename__ = 'payment_intents'
    
    id = db.Column(db.String(36), primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')
    webhook_url = db.Column(db.String(500), nullable=True)
    reservation_id = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'description': self.description,
            'status': self.status,
            'webhook_url': self.webhook_url,
            'reservation_id': self.reservation_id,
            'created_at': self.created_at.isoformat()
        }

class PaymentModel(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True)
    payment_intent_id = db.Column(db.String(36), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='completed')
    payment_method = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_intent_id': self.payment_intent_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
