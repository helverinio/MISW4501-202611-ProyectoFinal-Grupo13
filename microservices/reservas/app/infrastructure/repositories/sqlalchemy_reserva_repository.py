from typing import List, Optional
from sqlalchemy import and_, or_
from app import db
from app.domain.entities.reserva import Reserva
from app.domain.repositories.reserva_repository import ReservaRepository
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.estado_model import EstadoModel


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
            id_estado=reserva.id_estado
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
            id_estado=model.id_estado
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
