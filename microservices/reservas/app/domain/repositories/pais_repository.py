from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.pais import Pais


class PaisRepository(ABC):
    @abstractmethod
    def save(self, pais: Pais) -> Pais:
        pass

    @abstractmethod
    def find_by_id(self, pais_id: str) -> Optional[Pais]:
        pass

    @abstractmethod
    def find_all(self) -> List[Pais]:
        pass

    @abstractmethod
    def update(self, pais: Pais) -> Pais:
        pass

    @abstractmethod
    def delete(self, pais_id: str) -> bool:
        pass
