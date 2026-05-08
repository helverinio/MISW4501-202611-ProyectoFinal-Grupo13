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


@dataclass
class ReservationStateChangedEvent:
    reservation_id: str
    previous_state_id: str
    previous_state_name: str
    new_state_id: str
    new_state_name: str
    changed_by_user_id: str
    reason: str
    version: int
    updated_at: str

    @classmethod
    def create(
        cls,
        reservation_id: str,
        previous_state_id: str,
        previous_state_name: str,
        new_state_id: str,
        new_state_name: str,
        changed_by_user_id: str,
        reason: str,
        version: int,
    ) -> 'ReservationStateChangedEvent':
        return cls(
            reservation_id=reservation_id,
            previous_state_id=previous_state_id,
            previous_state_name=previous_state_name,
            new_state_id=new_state_id,
            new_state_name=new_state_name,
            changed_by_user_id=changed_by_user_id,
            reason=reason,
            version=version,
            updated_at=datetime.utcnow().isoformat(),
        )

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    def to_dict(self) -> dict:
        return asdict(self)
