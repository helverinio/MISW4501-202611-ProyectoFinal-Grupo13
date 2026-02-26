import json
from datetime import datetime
from dataclasses import dataclass, asdict


@dataclass
class PaymentStatusUpdatedEvent:
    payment_id: str
    payment_intent_id: str
    reservation_id: str
    status: str
    amount: float
    currency: str
    updated_at: str
    
    @classmethod
    def from_payment(cls, payment_data: dict) -> 'PaymentStatusUpdatedEvent':
        return cls(
            payment_id=payment_data.get('id'),
            payment_intent_id=payment_data.get('payment_intent_id'),
            reservation_id=payment_data.get('reservation_id'),
            status=payment_data.get('status'),
            amount=payment_data.get('amount'),
            currency=payment_data.get('currency'),
            updated_at=payment_data.get('updated_at', datetime.utcnow().isoformat())
        )
    
    def to_json(self) -> str:
        return json.dumps(asdict(self))
    
    def to_dict(self) -> dict:
        return asdict(self)
