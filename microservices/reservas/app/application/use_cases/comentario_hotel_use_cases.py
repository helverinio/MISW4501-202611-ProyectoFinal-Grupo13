from typing import Dict, List
from app.domain.entities.comentario_hotel import ComentarioHotel
from app.domain.repositories.comentario_hotel_repository import ComentarioHotelRepository


class RatingAggregationService:
    DEFAULT_RATING = 3.0

    def __init__(self, repository: ComentarioHotelRepository):
        self.repository = repository

    def get_hotel_rating_summary(self, id_hotel: str) -> Dict[str, float]:
        summary = self.repository.get_rating_summary(id_hotel)
        return self._normalize_summary(summary)

    def get_hotels_rating_summaries(self, hotel_ids: List[str]) -> Dict[str, Dict[str, float]]:
        raw_summaries = self.repository.get_rating_summaries_by_hoteles(hotel_ids)
        normalized = {}

        for hotel_id in hotel_ids:
            normalized[hotel_id] = self._normalize_summary(raw_summaries.get(hotel_id, {}))

        return normalized

    def _normalize_summary(self, summary: Dict[str, float]) -> Dict[str, float]:
        cantidad_ratings = int(summary.get('cantidad_ratings') or 0)
        cantidad_comentarios = int(summary.get('cantidad_comentarios') or 0)

        if cantidad_ratings == 0:
            return {
                'rating_promedio': self.DEFAULT_RATING,
                'cantidad_ratings': 0,
                'cantidad_comentarios': cantidad_comentarios,
            }

        rating_promedio = float(summary.get('rating_promedio') or self.DEFAULT_RATING)
        return {
            'rating_promedio': round(rating_promedio, 2),
            'cantidad_ratings': cantidad_ratings,
            'cantidad_comentarios': cantidad_comentarios,
        }


class CreateComentarioHotelUseCase:
    def __init__(
        self,
        repository: ComentarioHotelRepository,
        rating_aggregation_service: RatingAggregationService,
    ):
        self.repository = repository
        self.rating_aggregation_service = rating_aggregation_service

    def execute(
        self,
        id_hotel: str,
        id_usuario: str,
        id_reserva: str,
        rating: int,
        comentario: str = None,
    ) -> Dict[str, object]:
        self._validate_rating(rating)

        if not self.repository.reserva_belongs_to_hotel_and_usuario(id_reserva, id_hotel, id_usuario):
            raise ValueError('La reserva no pertenece al hotel o al usuario')

        if self.repository.exists_by_usuario_and_reserva(id_usuario, id_reserva):
            raise ValueError('Ya existe una reseña para esta reserva y usuario')

        comentario_hotel = ComentarioHotel.create(
            id_hotel=id_hotel,
            id_usuario=id_usuario,
            id_reserva=id_reserva,
            rating=rating,
            comentario=comentario,
        )
        saved = self.repository.save(comentario_hotel)

        return {
            'comentario': saved,
            'rating_hotel': self.rating_aggregation_service.get_hotel_rating_summary(id_hotel),
        }

    @staticmethod
    def _validate_rating(rating: int):
        if not isinstance(rating, int):
            raise ValueError('rating debe ser un entero entre 1 y 5')
        if rating < 1 or rating > 5:
            raise ValueError('rating debe ser un entero entre 1 y 5')


class ListComentariosHotelUseCase:
    def __init__(
        self,
        repository: ComentarioHotelRepository,
        rating_aggregation_service: RatingAggregationService,
    ):
        self.repository = repository
        self.rating_aggregation_service = rating_aggregation_service

    def execute(self, id_hotel: str, page: int = 1, per_page: int = 10) -> Dict[str, object]:
        if page < 1:
            raise ValueError('page debe ser mayor o igual a 1')
        if per_page < 1 or per_page > 100:
            raise ValueError('per_page debe estar entre 1 y 100')

        comentarios, total = self.repository.find_by_hotel_paginated(id_hotel, page, per_page)

        return {
            'comentarios': comentarios,
            'total': total,
            'page': page,
            'per_page': per_page,
            'rating_hotel': self.rating_aggregation_service.get_hotel_rating_summary(id_hotel),
        }


class GetHotelRatingSummaryUseCase:
    def __init__(self, rating_aggregation_service: RatingAggregationService):
        self.rating_aggregation_service = rating_aggregation_service

    def execute(self, id_hotel: str) -> Dict[str, float]:
        return self.rating_aggregation_service.get_hotel_rating_summary(id_hotel)
