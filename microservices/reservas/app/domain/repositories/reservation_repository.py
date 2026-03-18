from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.reservation import Reservation

class ReservationRepository(ABC):
    @abstractmethod
    def save(self, reservation: Reservation) -> Reservation:
        pass
    
    @abstractmethod
    def find_by_id(self, reservation_id: str) -> Optional[Reservation]:
        pass
    
    @abstractmethod
    def find_all(self) -> List[Reservation]:
        pass
    
    @abstractmethod
    def update(self, reservation: Reservation) -> Reservation:
        pass
    
    @abstractmethod
    def delete(self, reservation_id: str) -> bool:
        pass
