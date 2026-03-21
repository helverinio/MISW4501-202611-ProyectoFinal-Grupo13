from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.estado import Estado


class EstadoRepository(ABC):
    @abstractmethod
    def save(self, estado: Estado) -> Estado:
        pass

    @abstractmethod
    def find_by_id(self, estado_id: str) -> Optional[Estado]:
        pass

    @abstractmethod
    def find_all(self) -> List[Estado]:
        pass

    @abstractmethod
    def update(self, estado: Estado) -> Estado:
        pass

    @abstractmethod
    def delete(self, estado_id: str) -> bool:
        pass

    @abstractmethod
    def find_by_nombre(self, nombre: str) -> Optional['Estado']:
        pass
