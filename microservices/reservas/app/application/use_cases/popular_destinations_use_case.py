from collections import defaultdict
from typing import Dict, List, Optional

from app.application.use_cases.comentario_hotel_use_cases import RatingAggregationService
from app.domain.entities.hotel import Hotel
from app.domain.repositories.ciudad_repository import CiudadRepository
from app.domain.repositories.hotel_repository import HotelRepository
from app.domain.repositories.pais_repository import PaisRepository
from app.domain.repositories.pricing_repository import PricingRepository
from app.infrastructure.models.habitacion_model import HabitacionModel


class GetPopularDestinationsByCityUseCase:
    def __init__(
        self,
        hotel_repository: HotelRepository,
        ciudad_repository: CiudadRepository,
        pais_repository: PaisRepository,
        rating_aggregation_service: RatingAggregationService,
        pricing_repository: PricingRepository,
    ):
        self.hotel_repository = hotel_repository
        self.ciudad_repository = ciudad_repository
        self.pais_repository = pais_repository
        self.rating_aggregation_service = rating_aggregation_service
        self.pricing_repository = pricing_repository

    def execute(self, limit: int = 4) -> List[Dict[str, object]]:
        if limit < 1:
            raise ValueError('limit debe ser mayor o igual a 1')

        hoteles = self.hotel_repository.find_all()
        if not hoteles:
            return []

        grouped_by_city: Dict[str, List[Hotel]] = defaultdict(list)
        for hotel in hoteles:
            grouped_by_city[hotel.id_ciudad].append(hotel)

        ratings_by_hotel = self.rating_aggregation_service.get_hotels_rating_summaries(
            [hotel.id for hotel in hoteles]
        )

        destinations: List[Dict[str, object]] = []
        for ciudad_id, city_hotels in grouped_by_city.items():
            winner = self._pick_city_winner(city_hotels, ratings_by_hotel)
            if winner is None:
                continue

            winner_rating = ratings_by_hotel.get(winner.id, {
                'rating_promedio': RatingAggregationService.DEFAULT_RATING,
                'cantidad_ratings': 0,
                'cantidad_comentarios': 0,
            })
            min_price = self._get_min_price_per_night_for_hotel(winner.id)

            ciudad = self.ciudad_repository.find_by_id(ciudad_id)
            if not ciudad:
                continue
            pais = self.pais_repository.find_by_id(ciudad.id_pais)
            if not pais:
                continue

            destinations.append({
                'ciudad': ciudad.nombre,
                'pais': pais.nombre,
                'id_ciudad': ciudad.id,
                'hotel_id': winner.id,
                'hotel_nombre': winner.nombre,
                'rating_promedio': winner_rating['rating_promedio'],
                'cantidad_ratings': winner_rating['cantidad_ratings'],
                'precio_minimo_noche': round(min_price, 2) if min_price is not None else None,
                'moneda': 'USD',
                'hoteles_disponibles_ciudad': len(city_hotels),
            })

        destinations.sort(
            key=lambda row: (
                -row['rating_promedio'],
                -row['cantidad_ratings'],
                row['precio_minimo_noche'] if row['precio_minimo_noche'] is not None else float('inf'),
            )
        )
        return destinations[:limit]

    @staticmethod
    def _pick_city_winner(
        city_hotels: List[Hotel],
        ratings_by_hotel: Dict[str, Dict[str, float]],
    ) -> Optional[Hotel]:
        if not city_hotels:
            return None

        return max(
            city_hotels,
            key=lambda hotel: (
                ratings_by_hotel.get(hotel.id, {}).get('rating_promedio', RatingAggregationService.DEFAULT_RATING),
                ratings_by_hotel.get(hotel.id, {}).get('cantidad_ratings', 0),
                hotel.nombre,
            ),
        )

    def _get_min_price_per_night_for_hotel(self, hotel_id: str) -> Optional[float]:
        room_ids = [
            row[0]
            for row in HabitacionModel.query.with_entities(HabitacionModel.id).filter_by(id_hotel=hotel_id).all()
        ]
        if not room_ids:
            return None

        min_price: Optional[float] = None
        rules_cache: Dict[str, List[Dict[str, object]]] = {}

        for room_id in room_ids:
            context = self.pricing_repository.get_habitacion_context(room_id)
            if not context:
                continue

            room_type_id = context.get('id_tipo_habitacion')
            if not room_type_id:
                continue

            if room_type_id not in rules_cache:
                rules_cache[room_type_id] = self.pricing_repository.get_candidate_rules(room_type_id)

            for rule in rules_cache[room_type_id]:
                nightly_price = rule.get('precio_base_noche')
                if nightly_price is None:
                    continue
                price_value = float(nightly_price)
                if min_price is None or price_value < min_price:
                    min_price = price_value

        return round(min_price, 2) if min_price is not None else None