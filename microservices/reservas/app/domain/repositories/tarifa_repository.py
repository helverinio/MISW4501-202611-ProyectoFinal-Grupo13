from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.tarifa import Tarifa


class TarifaRepository(ABC):
    @abstractmethod
    def save(self, tarifa: Tarifa) -> Tarifa:
        pass

    @abstractmethod
    def find_by_id(self, tarifa_id: str) -> Optional[Tarifa]:
        pass

    @abstractmethod
    def find_all(self) -> List[Tarifa]:
        pass

    @abstractmethod
    def find_by_habitacion(self, habitacion_id: str) -> List[Tarifa]:
        pass

    @abstractmethod
    def update(self, tarifa: Tarifa) -> Tarifa:
        pass

    @abstractmethod
    def delete(self, tarifa_id: str) -> bool:
        pass
