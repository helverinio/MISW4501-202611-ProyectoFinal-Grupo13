from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.pago import Pago


class PagoRepository(ABC):
    @abstractmethod
    def save(self, pago: Pago) -> Pago:
        pass

    @abstractmethod
    def find_by_id(self, pago_id: str) -> Optional[Pago]:
        pass

    @abstractmethod
    def find_all(self) -> List[Pago]:
        pass

    @abstractmethod
    def find_by_reserva(self, reserva_id: str) -> List[Pago]:
        pass

    @abstractmethod
    def update(self, pago: Pago) -> Pago:
        pass

    @abstractmethod
    def delete(self, pago_id: str) -> bool:
        pass
