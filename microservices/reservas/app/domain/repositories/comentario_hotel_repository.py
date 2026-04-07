from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from app.domain.entities.comentario_hotel import ComentarioHotel


class ComentarioHotelRepository(ABC):
    @abstractmethod
    def save(self, comentario: ComentarioHotel) -> ComentarioHotel:
        pass

    @abstractmethod
    def exists_by_usuario_and_reserva(self, id_usuario: str, id_reserva: str) -> bool:
        pass

    @abstractmethod
    def reserva_belongs_to_hotel_and_usuario(
        self, id_reserva: str, id_hotel: str, id_usuario: str
    ) -> bool:
        pass

    @abstractmethod
    def find_by_hotel_paginated(
        self, id_hotel: str, page: int, per_page: int
    ) -> Tuple[List[ComentarioHotel], int]:
        pass

    @abstractmethod
    def get_rating_summary(self, id_hotel: str) -> Dict[str, Optional[float]]:
        pass

    @abstractmethod
    def get_rating_summaries_by_hoteles(self, hotel_ids: List[str]) -> Dict[str, Dict[str, float]]:
        pass
