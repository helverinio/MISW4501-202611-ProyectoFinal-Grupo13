from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import uuid

@dataclass
class Reservation:
    id: str
    user_id: str
    event_id: str
    seat_number: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def create(user_id: str, event_id: str, seat_number: Optional[str] = None) -> 'Reservation':
        now = datetime.utcnow()
        return Reservation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_id=event_id,
            seat_number=seat_number,
            status='pending',
            created_at=now,
            updated_at=now
        )
