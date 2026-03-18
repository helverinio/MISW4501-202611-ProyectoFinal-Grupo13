from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.ciudad import Ciudad


class CiudadRepository(ABC):
    @abstractmethod
    def save(self, ciudad: Ciudad) -> Ciudad:
        pass

    @abstractmethod
    def find_by_id(self, ciudad_id: str) -> Optional[Ciudad]:
        pass

    @abstractmethod
    def find_all(self) -> List[Ciudad]:
        pass

    @abstractmethod
    def find_by_pais(self, pais_id: str) -> List[Ciudad]:
        pass

    @abstractmethod
    def update(self, ciudad: Ciudad) -> Ciudad:
        pass

    @abstractmethod
    def delete(self, ciudad_id: str) -> bool:
        pass
