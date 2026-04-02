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
