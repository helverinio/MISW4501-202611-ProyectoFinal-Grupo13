from typing import Dict, List, Optional, Tuple
from sqlalchemy import case, func
from app import db
from app.domain.entities.comentario_hotel import ComentarioHotel
from app.domain.repositories.comentario_hotel_repository import ComentarioHotelRepository
from app.infrastructure.models.comentario_hotel_model import ComentarioHotelModel
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.reserva_model import ReservaModel


class SQLAlchemyComentarioHotelRepository(ComentarioHotelRepository):
    def save(self, comentario: ComentarioHotel) -> ComentarioHotel:
        model = ComentarioHotelModel(
            id=comentario.id,
            id_hotel=comentario.id_hotel,
            id_usuario=comentario.id_usuario,
            id_reserva=comentario.id_reserva,
            comentario=comentario.comentario,
            rating=comentario.rating,
            created_at=comentario.created_at,
            updated_at=comentario.updated_at,
            activo=comentario.activo,
        )
        db.session.add(model)
        db.session.commit()
        return comentario

    def exists_by_usuario_and_reserva(self, id_usuario: str, id_reserva: str) -> bool:
        return ComentarioHotelModel.query.filter_by(
            id_usuario=id_usuario,
            id_reserva=id_reserva,
            activo=True,
        ).first() is not None

    def reserva_belongs_to_hotel_and_usuario(
        self, id_reserva: str, id_hotel: str, id_usuario: str
    ) -> bool:
        row = db.session.query(ReservaModel.id).join(
            HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id
        ).filter(
            ReservaModel.id == id_reserva,
            ReservaModel.id_usuario == id_usuario,
            HabitacionModel.id_hotel == id_hotel,
        ).first()
        return row is not None

    def find_by_hotel_paginated(
        self, id_hotel: str, page: int, per_page: int
    ) -> Tuple[List[ComentarioHotel], int]:
        base_query = ComentarioHotelModel.query.filter_by(id_hotel=id_hotel, activo=True)
        total = base_query.count()
        models = base_query.order_by(
            ComentarioHotelModel.created_at.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return [self._to_entity(model) for model in models], total

    def get_rating_summary(self, id_hotel: str) -> Dict[str, Optional[float]]:
        row = db.session.query(
            func.avg(ComentarioHotelModel.rating),
            func.count(ComentarioHotelModel.id),
            func.sum(case((ComentarioHotelModel.comentario.isnot(None), 1), else_=0)),
        ).filter(
            ComentarioHotelModel.id_hotel == id_hotel,
            ComentarioHotelModel.activo.is_(True),
        ).one()

        avg_rating = float(row[0]) if row[0] is not None else None
        cantidad_ratings = int(row[1] or 0)
        cantidad_comentarios = int(row[2] or 0)
        return {
            'rating_promedio': avg_rating,
            'cantidad_ratings': cantidad_ratings,
            'cantidad_comentarios': cantidad_comentarios,
        }

    def get_rating_summaries_by_hoteles(self, hotel_ids: List[str]) -> Dict[str, Dict[str, float]]:
        if not hotel_ids:
            return {}

        rows = db.session.query(
            ComentarioHotelModel.id_hotel,
            func.avg(ComentarioHotelModel.rating),
            func.count(ComentarioHotelModel.id),
            func.sum(case((ComentarioHotelModel.comentario.isnot(None), 1), else_=0)),
        ).filter(
            ComentarioHotelModel.id_hotel.in_(hotel_ids),
            ComentarioHotelModel.activo.is_(True),
        ).group_by(ComentarioHotelModel.id_hotel).all()

        summary_map: Dict[str, Dict[str, float]] = {}
        for hotel_id, avg_rating, cantidad_ratings, cantidad_comentarios in rows:
            summary_map[hotel_id] = {
                'rating_promedio': float(avg_rating) if avg_rating is not None else None,
                'cantidad_ratings': int(cantidad_ratings or 0),
                'cantidad_comentarios': int(cantidad_comentarios or 0),
            }

        return summary_map

    def _to_entity(self, model: ComentarioHotelModel) -> ComentarioHotel:
        return ComentarioHotel(
            id=model.id,
            id_hotel=model.id_hotel,
            id_usuario=model.id_usuario,
            id_reserva=model.id_reserva,
            comentario=model.comentario,
            rating=model.rating,
            created_at=model.created_at,
            updated_at=model.updated_at,
            activo=model.activo,
        )
