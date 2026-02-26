from typing import List, Optional
from app.domain.entities.reservation import Reservation
from app.domain.repositories.reservation_repository import ReservationRepository

class CreateReservationUseCase:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository
    
    def execute(self, user_id: str, event_id: str, seat_number: Optional[str] = None) -> Reservation:
        reservation = Reservation.create(user_id, event_id, seat_number)
        return self.repository.save(reservation)

class GetReservationUseCase:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository
    
    def execute(self, reservation_id: str) -> Optional[Reservation]:
        return self.repository.find_by_id(reservation_id)

class GetAllReservationsUseCase:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository
    
    def execute(self) -> List[Reservation]:
        return self.repository.find_all()

class UpdateReservationUseCase:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository
    
    def execute(self, reservation_id: str, **kwargs) -> Optional[Reservation]:
        reservation = self.repository.find_by_id(reservation_id)
        if not reservation:
            return None
        
        from datetime import datetime
        if 'user_id' in kwargs:
            reservation.user_id = kwargs['user_id']
        if 'event_id' in kwargs:
            reservation.event_id = kwargs['event_id']
        if 'seat_number' in kwargs:
            reservation.seat_number = kwargs['seat_number']
        if 'status' in kwargs:
            reservation.status = kwargs['status']
        reservation.updated_at = datetime.utcnow()
        
        return self.repository.update(reservation)

class DeleteReservationUseCase:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository
    
    def execute(self, reservation_id: str) -> bool:
        return self.repository.delete(reservation_id)
