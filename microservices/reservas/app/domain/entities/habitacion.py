from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class Habitacion:
    id: str
    tipo: str
    nro_habitacion: int
    capacidad: int
    camas: int
    id_hotel: str
    id_tipo_habitacion: Optional[str] = None

    @staticmethod
    def create(tipo: str, nro_habitacion: int, capacidad: int, 
               camas: int, id_hotel: str, id_tipo_habitacion: Optional[str] = None) -> 'Habitacion':
        return Habitacion(
            id=str(uuid.uuid4()),
            tipo=tipo,
            nro_habitacion=nro_habitacion,
            capacidad=capacidad,
            camas=camas,
            id_hotel=id_hotel,
            id_tipo_habitacion=id_tipo_habitacion
        )
