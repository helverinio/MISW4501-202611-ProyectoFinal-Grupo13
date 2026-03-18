from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.reserva import Reserva


class ReservaRepository(ABC):
    @abstractmethod
    def save(self, reserva: Reserva) -> Reserva:
        pass

    @abstractmethod
    def find_by_id(self, reserva_id: str) -> Optional[Reserva]:
        pass

    @abstractmethod
    def find_all(self) -> List[Reserva]:
        pass

    @abstractmethod
    def find_by_usuario(self, usuario_id: str) -> List[Reserva]:
        pass

    @abstractmethod
    def find_by_habitacion(self, habitacion_id: str) -> List[Reserva]:
        pass

    @abstractmethod
    def update(self, reserva: Reserva) -> Reserva:
        pass

    @abstractmethod
    def delete(self, reserva_id: str) -> bool:
        pass

    @abstractmethod
    def has_overlapping_confirmed_reservation(
        self, habitacion_id: str, fecha_ingreso, fecha_salida, confirmed_estado_nombres: List[str]
    ) -> bool:
        pass
