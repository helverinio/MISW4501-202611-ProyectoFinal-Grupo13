from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date
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
    def find_available_by_hotel(
        self, hotel_id: str, fecha_ingreso: date, fecha_salida: date, 
        capacidad_minima: int, confirmed_estado_nombres: List[str]
    ) -> List[Habitacion]:
        """Encuentra habitaciones disponibles en un hotel para fechas y capacidad determinadas"""
        pass

    @abstractmethod
    def update(self, habitacion: Habitacion) -> Habitacion:
        pass

    @abstractmethod
    def delete(self, habitacion_id: str) -> bool:
        pass
