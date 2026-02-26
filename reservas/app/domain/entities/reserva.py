from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class Reserva:
    id: str
    fecha_ingreso: datetime
    fecha_salida: datetime
    total: float
    nro_personas: int
    id_usuario: str
    id_pais: str
    id_habitacion: str
    id_estado: str

    @staticmethod
    def create(fecha_ingreso: datetime, fecha_salida: datetime, total: float,
               nro_personas: int, id_usuario: str, id_pais: str,
               id_habitacion: str, id_estado: str) -> 'Reserva':
        return Reserva(
            id=str(uuid.uuid4()),
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            total=total,
            nro_personas=nro_personas,
            id_usuario=id_usuario,
            id_pais=id_pais,
            id_habitacion=id_habitacion,
            id_estado=id_estado
        )
