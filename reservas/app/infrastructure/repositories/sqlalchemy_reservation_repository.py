from typing import List, Optional
from app import db
from app.domain.entities.reservation import Reservation
from app.domain.repositories.reservation_repository import ReservationRepository
from app.infrastructure.models.reservation_model import ReservationModel

class SQLAlchemyReservationRepository(ReservationRepository):
    def save(self, reservation: Reservation) -> Reservation:
        model = ReservationModel(
            id=reservation.id,
            user_id=reservation.user_id,
            event_id=reservation.event_id,
            seat_number=reservation.seat_number,
            status=reservation.status,
            created_at=reservation.created_at,
            updated_at=reservation.updated_at
        )
        db.session.add(model)
        db.session.commit()
        return reservation
    
    def find_by_id(self, reservation_id: str) -> Optional[Reservation]:
        model = ReservationModel.query.get(reservation_id)
        if not model:
            return None
        return self._to_entity(model)
    
    def find_all(self) -> List[Reservation]:
        models = ReservationModel.query.all()
        return [self._to_entity(m) for m in models]
    
    def update(self, reservation: Reservation) -> Reservation:
        model = ReservationModel.query.get(reservation.id)
        if model:
            model.user_id = reservation.user_id
            model.event_id = reservation.event_id
            model.seat_number = reservation.seat_number
            model.status = reservation.status
            model.updated_at = reservation.updated_at
            db.session.commit()
        return reservation
    
    def delete(self, reservation_id: str) -> bool:
        model = ReservationModel.query.get(reservation_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False
    
    def _to_entity(self, model: ReservationModel) -> Reservation:
        return Reservation(
            id=model.id,
            user_id=model.user_id,
            event_id=model.event_id,
            seat_number=model.seat_number,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
