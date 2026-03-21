from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.habitacion import Habitacion


class HabitacionRepository(ABC):
    @abstractmethod
    def save(self, habitacion: Habitacion) -> Habitacion:
        pass

    @abstractmethod
    def find_by_id(self, habitacion_id: str) -> Optional[Habitacion]:
        pass

    @abstractmethod
    def find_all(self) -> List[Habitacion]:
        pass

    @abstractmethod
    def find_by_hotel(self, hotel_id: str) -> List[Habitacion]:
        pass

    @abstractmethod
    def update(self, habitacion: Habitacion) -> Habitacion:
        pass

    @abstractmethod
    def delete(self, habitacion_id: str) -> bool:
        pass
