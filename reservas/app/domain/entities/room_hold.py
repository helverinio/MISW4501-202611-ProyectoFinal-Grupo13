from dataclasses import dataclass
from datetime import datetime, timedelta
import uuid


@dataclass
class RoomHold:
    id: str
    id_habitacion: str
    id_usuario: str
    fecha_ingreso: datetime
    fecha_salida: datetime
    created_at: datetime
    expires_at: datetime

    @staticmethod
    def create(id_habitacion: str, id_usuario: str, fecha_ingreso: datetime,
               fecha_salida: datetime, hold_duration_minutes: int = 15) -> 'RoomHold':
        now = datetime.utcnow()
        return RoomHold(
            id=str(uuid.uuid4()),
            id_habitacion=id_habitacion,
            id_usuario=id_usuario,
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            created_at=now,
            expires_at=now + timedelta(minutes=hold_duration_minutes)
        )

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def is_active(self) -> bool:
        return not self.is_expired()
