from dataclasses import dataclass
from typing import List, Optional


@dataclass
class RoomAvailability:
    """Representa una habitación disponible con su información"""
    habitacion_id: str
    tipo: str
    nro_habitacion: str
    capacidad: int
    camas: int
    moneda: Optional[str] = None
    precio_total_reserva: Optional[float] = None
    precio_promedio_noche: Optional[float] = None


@dataclass
class SearchHotelResult:
    """Resultado de búsqueda de hotel con información de disponibilidad"""
    hotel_id: str
    nombre: str
    descripcion: Optional[str]
    amenidades: Optional[str]
    email: str
    ciudad_nombre: str
    pais_nombre: str
    available_rooms: List[RoomAvailability]
    total_available_rooms: int
    rating_promedio: float = 3.0
    cantidad_ratings: int = 0
    cantidad_comentarios: int = 0
