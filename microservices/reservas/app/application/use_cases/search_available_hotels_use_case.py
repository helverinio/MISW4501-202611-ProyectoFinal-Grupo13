import logging
from typing import List
from datetime import date
from app.domain.entities.search_hotel_result import SearchHotelResult, RoomAvailability
from app.domain.repositories.hotel_repository import HotelRepository
from app.domain.repositories.habitacion_repository import HabitacionRepository
from app.domain.repositories.ciudad_repository import CiudadRepository
from app.domain.repositories.pais_repository import PaisRepository
from app.application.use_cases.pricing_use_cases import PricingService, PricingRuleNotFoundError

logger = logging.getLogger(__name__)


class SearchAvailableHotelsUseCase:
    def __init__(
        self,
        hotel_repository: HotelRepository,
        habitacion_repository: HabitacionRepository,
        ciudad_repository: CiudadRepository,
        pais_repository: PaisRepository,
        pricing_service: PricingService = None,
        rating_aggregation_service=None,
    ):
        self.hotel_repository = hotel_repository
        self.habitacion_repository = habitacion_repository
        self.ciudad_repository = ciudad_repository
        self.pais_repository = pais_repository
        self.pricing_service = pricing_service
        self.rating_aggregation_service = rating_aggregation_service

    def execute(
        self,
        busqueda: str,
        fecha_ingreso: date,
        fecha_salida: date,
        nro_personas: int,
        confirmed_estado_nombres: List[str]
    ) -> List[SearchHotelResult]:
        """
        Busca hoteles disponibles con habitaciones que cumplan los criterios
        
        Args:
            busqueda: Término de búsqueda (nombre del hotel o ciudad)
            fecha_ingreso: Fecha de entrada
            fecha_salida: Fecha de salida
            nro_personas: Número de personas (usa capacidad mínima)
            confirmed_estado_nombres: Lista de nombres de estados confirmados
            
        Returns:
            Lista de SearchHotelResult con hoteles y habitaciones disponibles
        """
        
        # Buscar hoteles por nombre o ciudad
        hoteles = self.hotel_repository.search_by_name_or_ciudad(busqueda)
        logger.info("[SearchUseCase] Hoteles encontrados para busqueda='%s': %d",
                    busqueda, len(hoteles))
        for h in hoteles:
            logger.debug("[SearchUseCase]   -> hotel_id=%s nombre='%s' id_ciudad=%s",
                         h.id, h.nombre, h.id_ciudad)
        
        results = []
        ratings_summary = {}
        if self.rating_aggregation_service and hoteles:
            ratings_summary = self.rating_aggregation_service.get_hotels_rating_summaries(
                [hotel.id for hotel in hoteles]
            )
        
        for hotel in hoteles:
            # Obtener ciudad para el nombre
            ciudad = self.ciudad_repository.find_by_id(hotel.id_ciudad)
            if not ciudad:
                logger.warning("[SearchUseCase] Hotel '%s' (id=%s): ciudad id=%s NO encontrada, se omite",
                                hotel.nombre, hotel.id, hotel.id_ciudad)
                continue
            
            # Obtener país para el nombre
            pais = self.pais_repository.find_by_id(ciudad.id_pais)
            if not pais:
                logger.warning("[SearchUseCase] Hotel '%s': pais id=%s NO encontrado para ciudad '%s', se omite",
                                hotel.nombre, ciudad.id_pais, ciudad.nombre)
                continue
            
            # Buscar habitaciones disponibles en este hotel
            logger.info("[SearchUseCase] Buscando habitaciones en hotel '%s' (id=%s) - fechas %s/%s, personas=%d",
                         hotel.nombre, hotel.id, fecha_ingreso, fecha_salida, nro_personas)
            habitaciones_disponibles = self.habitacion_repository.find_available_by_hotel(
                hotel.id,
                fecha_ingreso,
                fecha_salida,
                nro_personas,
                confirmed_estado_nombres
            )
            logger.info("[SearchUseCase] Hotel '%s': %d habitaciones disponibles",
                         hotel.nombre, len(habitaciones_disponibles))
            
            if habitaciones_disponibles:
                # Convertir habitaciones a RoomAvailability
                rooms = [
                    self._to_room_availability(h, fecha_ingreso, fecha_salida, nro_personas)
                    for h in habitaciones_disponibles
                ]
                rooms = [room for room in rooms if room is not None]
                if not rooms:
                    continue
                
                # Crear resultado de búsqueda
                hotel_rating = ratings_summary.get(hotel.id, {
                    'rating_promedio': 3.0,
                    'cantidad_ratings': 0,
                    'cantidad_comentarios': 0,
                })
                result = SearchHotelResult(
                    hotel_id=hotel.id,
                    nombre=hotel.nombre,
                    descripcion=hotel.descripcion,
                    amenidades=hotel.amenidades,
                    email=hotel.email,
                    ciudad_nombre=ciudad.nombre,
                    pais_nombre=pais.nombre,
                    available_rooms=rooms,
                    total_available_rooms=len(rooms),
                    rating_promedio=hotel_rating['rating_promedio'],
                    cantidad_ratings=hotel_rating['cantidad_ratings'],
                    cantidad_comentarios=hotel_rating['cantidad_comentarios'],
                )
                results.append(result)
        
        return results

    def _to_room_availability(self, habitacion, fecha_ingreso, fecha_salida, nro_personas):
        if not self.pricing_service:
            return RoomAvailability(
                habitacion_id=habitacion.id,
                tipo=habitacion.tipo,
                nro_habitacion=habitacion.nro_habitacion,
                capacidad=habitacion.capacidad,
                camas=habitacion.camas
            )

        try:
            pricing = self.pricing_service.calculate_stay(
                id_habitacion=habitacion.id,
                fecha_ingreso=fecha_ingreso,
                fecha_salida=fecha_salida,
                nro_personas=nro_personas
            )
            avg = pricing['total'] / pricing['noches'] if pricing['noches'] else pricing['total']
            return RoomAvailability(
                habitacion_id=habitacion.id,
                tipo=habitacion.tipo,
                nro_habitacion=habitacion.nro_habitacion,
                capacidad=habitacion.capacidad,
                camas=habitacion.camas,
                moneda=pricing['moneda'],
                precio_total_reserva=pricing['total'],
                precio_promedio_noche=round(avg, 2)
            )
        except (PricingRuleNotFoundError, ValueError) as ex:
            logger.warning(
                "[SearchUseCase] Habitacion %s omitida por pricing: %s",
                habitacion.id,
                str(ex)
            )
            return None
