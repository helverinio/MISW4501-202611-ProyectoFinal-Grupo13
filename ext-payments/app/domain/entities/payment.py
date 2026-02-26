from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import uuid

@dataclass
class PaymentIntent:
    id: str
    amount: float
    currency: str
    description: Optional[str]
    status: str
    webhook_url: Optional[str]
    created_at: datetime
    
    @staticmethod
    def create(amount: float, currency: str, description: Optional[str] = None, 
               webhook_url: Optional[str] = None) -> 'PaymentIntent':
        return PaymentIntent(
            id=str(uuid.uuid4()),
            amount=amount,
            currency=currency,
            description=description,
            status='pending',
            webhook_url=webhook_url,
            created_at=datetime.utcnow()
        )

@dataclass
class Payment:
    id: str
    payment_intent_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def create(payment_intent_id: str, amount: float, currency: str, payment_method: str) -> 'Payment':
        now = datetime.utcnow()
        return Payment(
            id=str(uuid.uuid4()),
            payment_intent_id=payment_intent_id,
            amount=amount,
            currency=currency,
            status='completed',
            payment_method=payment_method,
            created_at=now,
            updated_at=now
        )
