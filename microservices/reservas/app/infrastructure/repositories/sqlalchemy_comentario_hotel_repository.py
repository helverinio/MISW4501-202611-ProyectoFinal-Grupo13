from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy import case, func, and_, or_
from app import db
from app.domain.entities.comentario_hotel import ComentarioHotel
from app.domain.entities.admin_review import AdminReview
from app.domain.repositories.comentario_hotel_repository import ComentarioHotelRepository
from app.infrastructure.models.comentario_hotel_model import ComentarioHotelModel
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.hotel_model import HotelModel
from app.infrastructure.models.tipo_habitacion_model import TipoHabitacionModel


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

    def find_admin_reviews_with_filters(
        self,
        authorized_hotel_ids: List[str],
        rating_filter: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sentiment_filter: Optional[str] = None,
        search_text: Optional[str] = None,
        page: int = 1,
        per_page: int = 10,
        sort_by: str = 'created_at_desc'
    ) -> Tuple[List[AdminReview], int]:
        """
        Query reviews with admin-level filters and joins to enrich with guest/hotel/room data.
        
        Args:
            authorized_hotel_ids: List of hotel IDs the admin is authorized to view
            rating_filter: Exact rating to filter by (1-5) or None for all
            date_from: Filter reviews created on or after this date
            date_to: Filter reviews created on or before this date
            sentiment_filter: Filter by sentiment ('positive', 'neutral', 'negative')
            search_text: Free-text search in comments
            page: Pagination page number
            per_page: Items per page
            sort_by: Sort key - 'created_at_desc', 'created_at_asc', 'rating_desc', 'rating_asc'
        
        Returns:
            Tuple of (list of AdminReview objects, total count)
        """
        # Start building query with joins
        query = db.session.query(
            ComentarioHotelModel.id,
            ComentarioHotelModel.rating,
            ComentarioHotelModel.comentario,
            ComentarioHotelModel.created_at,
            ComentarioHotelModel.updated_at,
            ComentarioHotelModel.id_hotel,
            ComentarioHotelModel.id_usuario,
            ComentarioHotelModel.id_reserva,
            HotelModel.nombre,
            HabitacionModel.nro_habitacion,
            HabitacionModel.tipo,
            HabitacionModel.capacidad,
            ReservaModel.fecha_ingreso,
            ReservaModel.fecha_salida,
            ReservaModel.nro_personas,
        ).join(
            HotelModel, ComentarioHotelModel.id_hotel == HotelModel.id
        ).join(
            ReservaModel, ComentarioHotelModel.id_reserva == ReservaModel.id
        ).join(
            HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id
        )
        
        # Apply base filters
        query = query.filter(
            ComentarioHotelModel.activo.is_(True),
            ComentarioHotelModel.id_hotel.in_(authorized_hotel_ids),
        )
        
        # Apply optional filters
        if rating_filter is not None:
            query = query.filter(ComentarioHotelModel.rating == rating_filter)
        
        if date_from is not None:
            query = query.filter(ComentarioHotelModel.created_at >= date_from)
        
        if date_to is not None:
            query = query.filter(ComentarioHotelModel.created_at <= date_to)
        
        if sentiment_filter is not None:
            # Map sentiment to rating ranges: positive (4-5), neutral (3), negative (1-2)
            if sentiment_filter == 'positive':
                query = query.filter(ComentarioHotelModel.rating >= 4)
            elif sentiment_filter == 'neutral':
                query = query.filter(ComentarioHotelModel.rating == 3)
            elif sentiment_filter == 'negative':
                query = query.filter(ComentarioHotelModel.rating <= 2)
        
        if search_text is not None and search_text.strip():
            search_pattern = f"%{search_text.strip()}%"
            query = query.filter(ComentarioHotelModel.comentario.ilike(search_pattern))
        
        # Count total before pagination
        total = query.count()
        
        # Apply sorting
        if sort_by == 'rating_desc':
            query = query.order_by(ComentarioHotelModel.rating.desc())
        elif sort_by == 'rating_asc':
            query = query.order_by(ComentarioHotelModel.rating.asc())
        elif sort_by == 'created_at_asc':
            query = query.order_by(ComentarioHotelModel.created_at.asc())
        else:  # default to created_at_desc
            query = query.order_by(ComentarioHotelModel.created_at.desc())
        
        # Apply pagination
        results = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Map results to AdminReview entities
        admin_reviews = []
        for row in results:
            # Create a simple object to pass to AdminReview.from_db_row
            class RowWrapper:
                pass
            
            wrapped_row = RowWrapper()
            wrapped_row.id = row.id
            wrapped_row.rating = row.rating
            wrapped_row.comentario = row.comentario
            wrapped_row.created_at = row.created_at
            wrapped_row.updated_at = row.updated_at
            wrapped_row.id_hotel = row.id_hotel
            wrapped_row.nombre_hotel = row.nombre
            wrapped_row.id_usuario = row.id_usuario
            wrapped_row.nombre_usuario = None  # Will use fallback in from_db_row
            wrapped_row.nro_habitacion = row.nro_habitacion
            wrapped_row.tipo_habitacion = row.tipo
            wrapped_row.capacidad = row.capacidad
            wrapped_row.id_reserva = row.id_reserva
            wrapped_row.fecha_ingreso = row.fecha_ingreso
            wrapped_row.fecha_salida = row.fecha_salida
            wrapped_row.nro_personas = row.nro_personas
            
            admin_reviews.append(AdminReview.from_db_row(wrapped_row))
        
        return admin_reviews, total

    def get_admin_reviews_kpis(
        self,
        authorized_hotel_ids: List[str],
        rating_filter: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sentiment_filter: Optional[str] = None,
        search_text: Optional[str] = None,
    ) -> Dict[str, any]:
        """
        Compute KPI metrics for the given filter set without pagination.
        Returns: average_rating, total_reviews, reviews_with_comments, 
                positive_count, neutral_count, negative_count, verified_stays
        """
        query = db.session.query(
            func.avg(ComentarioHotelModel.rating).label('avg_rating'),
            func.count(ComentarioHotelModel.id).label('total_count'),
            func.sum(case((ComentarioHotelModel.comentario.isnot(None), 1), else_=0)).label('comments_count'),
            func.sum(case((ComentarioHotelModel.rating >= 4, 1), else_=0)).label('positive_count'),
            func.sum(case((ComentarioHotelModel.rating == 3, 1), else_=0)).label('neutral_count'),
            func.sum(case((ComentarioHotelModel.rating <= 2, 1), else_=0)).label('negative_count'),
        ).filter(
            ComentarioHotelModel.activo.is_(True),
            ComentarioHotelModel.id_hotel.in_(authorized_hotel_ids),
        )
        
        # Apply same filters as find_admin_reviews_with_filters
        if rating_filter is not None:
            query = query.filter(ComentarioHotelModel.rating == rating_filter)
        
        if date_from is not None:
            query = query.filter(ComentarioHotelModel.created_at >= date_from)
        
        if date_to is not None:
            query = query.filter(ComentarioHotelModel.created_at <= date_to)
        
        if sentiment_filter is not None:
            if sentiment_filter == 'positive':
                query = query.filter(ComentarioHotelModel.rating >= 4)
            elif sentiment_filter == 'neutral':
                query = query.filter(ComentarioHotelModel.rating == 3)
            elif sentiment_filter == 'negative':
                query = query.filter(ComentarioHotelModel.rating <= 2)
        
        if search_text is not None and search_text.strip():
            search_pattern = f"%{search_text.strip()}%"
            query = query.filter(ComentarioHotelModel.comentario.ilike(search_pattern))
        
        result = query.one()
        
        total_count = result.total_count or 0
        avg_rating = float(result.avg_rating) if result.avg_rating else 0.0
        comments_count = int(result.comments_count or 0)
        positive_count = int(result.positive_count or 0)
        neutral_count = int(result.neutral_count or 0)
        negative_count = int(result.negative_count or 0)
        
        # Calculate percentages
        response_rate = (comments_count / total_count * 100) if total_count > 0 else 0.0
        positive_percentage = (positive_count / total_count * 100) if total_count > 0 else 0.0
        
        return {
            'average_rating': round(avg_rating, 2),
            'total_reviews': total_count,
            'reviews_with_comments': comments_count,
            'positive_count': positive_count,
            'neutral_count': neutral_count,
            'negative_count': negative_count,
            'positive_percentage': round(positive_percentage, 2),
            'response_rate': round(response_rate, 2),
        }
