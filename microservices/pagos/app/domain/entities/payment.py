from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import uuid

@dataclass
class Payment:
    id: str
    external_payment_id: Optional[str]
    payment_intent_id: str
    reservation_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def create(payment_intent_id: str, reservation_id: str, amount: float, 
               currency: str, payment_method: str, status: str = 'pendiente',
               external_payment_id: Optional[str] = None) -> 'Payment':
        now = datetime.utcnow()
        return Payment(
            id=str(uuid.uuid4()),
            external_payment_id=external_payment_id,
            payment_intent_id=payment_intent_id,
            reservation_id=reservation_id,
            amount=amount,
            currency=currency,
            status=status,
            payment_method=payment_method,
            created_at=now,
            updated_at=now
        )
