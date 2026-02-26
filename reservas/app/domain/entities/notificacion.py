from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class Notificacion:
    id: str
    fecha_notif: datetime
    titulo: str
    descripcion: Optional[str]
    id_reserva: str

    @staticmethod
    def create(fecha_notif: datetime, titulo: str, id_reserva: str,
               descripcion: Optional[str] = None) -> 'Notificacion':
        return Notificacion(
            id=str(uuid.uuid4()),
            fecha_notif=fecha_notif,
            titulo=titulo,
            descripcion=descripcion,
            id_reserva=id_reserva
        )
