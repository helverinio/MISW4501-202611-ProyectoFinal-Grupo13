import json
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class PaymentStatusUpdatedEvent:
    payment_intent_id: str
    reservation_id: str
    status: str
    amount: float
    currency: str
    updated_at: str
    
    @classmethod
    def create(cls, payment_intent_id: str, reservation_id: str, status: str, 
               amount: float, currency: str) -> 'PaymentStatusUpdatedEvent':
        return cls(
            payment_intent_id=payment_intent_id,
            reservation_id=reservation_id,
            status=status,
            amount=amount,
            currency=currency,
            updated_at=datetime.utcnow().isoformat()
        )
    
    def to_json(self) -> str:
        return json.dumps(asdict(self))
    
    def to_dict(self) -> dict:
        return asdict(self)
