from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.hotel import Hotel


class HotelRepository(ABC):
    @abstractmethod
    def save(self, hotel: Hotel) -> Hotel:
        pass

    @abstractmethod
    def find_by_id(self, hotel_id: str) -> Optional[Hotel]:
        pass

    @abstractmethod
    def find_all(self) -> List[Hotel]:
        pass

    @abstractmethod
    def find_by_ciudad(self, ciudad_id: str) -> List[Hotel]:
        pass

    @abstractmethod
    def search_by_name_or_ciudad(self, busqueda: str) -> List[Hotel]:
        """Busca hoteles por nombre o ciudad"""
        pass

    @abstractmethod
    def update(self, hotel: Hotel) -> Hotel:
        pass

    @abstractmethod
    def delete(self, hotel_id: str) -> bool:
        pass
