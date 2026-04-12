from typing import List, Optional
from sqlalchemy import and_, or_, func
from app import db
from app.domain.entities.reserva import Reserva
from app.domain.repositories.reserva_repository import ReservaRepository
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.estado_model import EstadoModel
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.hotel_model import HotelModel
from app.infrastructure.models.ciudad_model import CiudadModel
from app.infrastructure.models.pais_model import PaisModel
from app.infrastructure.models.comentario_hotel_model import ComentarioHotelModel


class SQLAlchemyReservaRepository(ReservaRepository):
    def save(self, reserva: Reserva) -> Reserva:
        model = ReservaModel(
            id=reserva.id,
            fecha_ingreso=reserva.fecha_ingreso,
            fecha_salida=reserva.fecha_salida,
            total=reserva.total,
            nro_personas=reserva.nro_personas,
            id_usuario=reserva.id_usuario,
            id_pais=reserva.id_pais,
            id_habitacion=reserva.id_habitacion,
            id_estado=reserva.id_estado,
            id_cotizacion=reserva.id_cotizacion
        )
        db.session.add(model)
        db.session.commit()
        return reserva

    def find_by_id(self, reserva_id: str) -> Optional[Reserva]:
        model = ReservaModel.query.get(reserva_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Reserva]:
        models = ReservaModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_usuario(self, usuario_id: str) -> List[Reserva]:
        models = ReservaModel.query.filter_by(id_usuario=usuario_id).all()
        return [self._to_entity(m) for m in models]

    def find_by_habitacion(self, habitacion_id: str) -> List[Reserva]:
        models = ReservaModel.query.filter_by(id_habitacion=habitacion_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, reserva: Reserva) -> Reserva:
        model = ReservaModel.query.get(reserva.id)
        if model:
            model.fecha_ingreso = reserva.fecha_ingreso
            model.fecha_salida = reserva.fecha_salida
            model.total = reserva.total
            model.nro_personas = reserva.nro_personas
            model.id_usuario = reserva.id_usuario
            model.id_pais = reserva.id_pais
            model.id_habitacion = reserva.id_habitacion
            model.id_estado = reserva.id_estado
            model.id_cotizacion = reserva.id_cotizacion
            db.session.commit()
        return reserva

    def delete(self, reserva_id: str) -> bool:
        model = ReservaModel.query.get(reserva_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: ReservaModel) -> Reserva:
        return Reserva(
            id=model.id,
            fecha_ingreso=model.fecha_ingreso,
            fecha_salida=model.fecha_salida,
            total=model.total,
            nro_personas=model.nro_personas,
            id_usuario=model.id_usuario,
            id_pais=model.id_pais,
            id_habitacion=model.id_habitacion,
            id_estado=model.id_estado,
            id_cotizacion=model.id_cotizacion
        )

    def has_overlapping_confirmed_reservation(
        self, habitacion_id: str, fecha_ingreso, fecha_salida, confirmed_estado_nombres: List[str]
    ) -> bool:
        confirmed_estado_ids = db.session.query(EstadoModel.id).filter(
            EstadoModel.nombre.in_(confirmed_estado_nombres)
        ).subquery()

        overlapping = ReservaModel.query.filter(
            and_(
                ReservaModel.id_habitacion == habitacion_id,
                ReservaModel.id_estado.in_(confirmed_estado_ids),
                ReservaModel.fecha_ingreso < fecha_salida,
                ReservaModel.fecha_salida > fecha_ingreso
            )
        ).first()

        return overlapping is not None

    def find_recently_viewed_enriched(self, usuario_id: str, limit: int) -> List[dict]:
        cancelled_estado_ids = db.session.query(EstadoModel.id).filter(
            EstadoModel.nombre.in_(['cancelada', 'Cancelada', 'CANCELADA'])
        ).subquery()

        models = (
            ReservaModel.query
            .filter(
                ReservaModel.id_usuario == usuario_id,
                ReservaModel.id_estado.notin_(cancelled_estado_ids),
            )
            .order_by(ReservaModel.created_at.desc())
            .limit(limit)
            .all()
        )

        result = []
        for m in models:
            habitacion = HabitacionModel.query.get(m.id_habitacion)
            if not habitacion:
                continue
            hotel = HotelModel.query.get(habitacion.id_hotel)
            if not hotel:
                continue
            ciudad = CiudadModel.query.get(hotel.id_ciudad)
            pais = PaisModel.query.get(ciudad.id_pais) if ciudad else None

            dias = (m.fecha_salida - m.fecha_ingreso).days
            nightly_price = m.total / dias if dias > 0 else m.total

            rating_avg = db.session.query(func.avg(ComentarioHotelModel.rating)).filter(
                ComentarioHotelModel.id_hotel == hotel.id,
                ComentarioHotelModel.activo == True,
            ).scalar()

            result.append({
                'reserva_id': m.id,
                'hotel_id': hotel.id,
                'hotel_name': hotel.nombre,
                'city': ciudad.nombre if ciudad else None,
                'country': pais.nombre if pais else None,
                'rating': round(float(rating_avg), 1) if rating_avg else None,
                'nightly_price': round(nightly_price, 2),
                'total': m.total,
                'fecha_ingreso': m.fecha_ingreso.isoformat(),
                'fecha_salida': m.fecha_salida.isoformat(),
                'created_at': m.created_at.isoformat() if m.created_at else None,
            })

        return result
