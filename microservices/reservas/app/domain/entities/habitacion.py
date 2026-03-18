from dataclasses import dataclass
import uuid


@dataclass
class Habitacion:
    id: str
    tipo: str
    nro_habitacion: int
    capacidad: int
    camas: int
    id_hotel: str

    @staticmethod
    def create(tipo: str, nro_habitacion: int, capacidad: int, 
               camas: int, id_hotel: str) -> 'Habitacion':
        return Habitacion(
            id=str(uuid.uuid4()),
            tipo=tipo,
            nro_habitacion=nro_habitacion,
            capacidad=capacidad,
            camas=camas,
            id_hotel=id_hotel
        )
