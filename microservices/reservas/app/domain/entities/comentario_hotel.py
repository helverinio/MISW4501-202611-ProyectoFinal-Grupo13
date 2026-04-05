from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import uuid


@dataclass
class ComentarioHotel:
    id: str
    id_hotel: str
    id_usuario: str
    id_reserva: str
    comentario: Optional[str]
    rating: int
    created_at: datetime
    updated_at: datetime
    activo: bool = True

    @staticmethod
    def create(
        id_hotel: str,
        id_usuario: str,
        id_reserva: str,
        rating: int,
        comentario: Optional[str] = None,
    ) -> 'ComentarioHotel':
        now = datetime.utcnow()
        normalized_comment = comentario.strip() if isinstance(comentario, str) else comentario
        if normalized_comment == '':
            normalized_comment = None

        return ComentarioHotel(
            id=str(uuid.uuid4()),
            id_hotel=id_hotel,
            id_usuario=id_usuario,
            id_reserva=id_reserva,
            comentario=normalized_comment,
            rating=rating,
            created_at=now,
            updated_at=now,
            activo=True,
        )
