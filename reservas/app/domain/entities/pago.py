from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class Pago:
    id: str
    fecha_pago: datetime
    total: float
    estado: str
    id_pais: str
    id_reserva: str

    @staticmethod
    def create(fecha_pago: datetime, total: float, estado: str,
               id_pais: str, id_reserva: str) -> 'Pago':
        return Pago(
            id=str(uuid.uuid4()),
            fecha_pago=fecha_pago,
            total=total,
            estado=estado,
            id_pais=id_pais,
            id_reserva=id_reserva
        )
