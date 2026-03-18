from typing import List, Optional
from app import db
from app.domain.entities.notificacion import Notificacion
from app.domain.repositories.notificacion_repository import NotificacionRepository
from app.infrastructure.models.notificacion_model import NotificacionModel


class SQLAlchemyNotificacionRepository(NotificacionRepository):
    def save(self, notificacion: Notificacion) -> Notificacion:
        model = NotificacionModel(
            id=notificacion.id,
            fecha_notif=notificacion.fecha_notif,
            titulo=notificacion.titulo,
            descripcion=notificacion.descripcion,
            id_reserva=notificacion.id_reserva
        )
        db.session.add(model)
        db.session.commit()
        return notificacion

    def find_by_id(self, notificacion_id: str) -> Optional[Notificacion]:
        model = NotificacionModel.query.get(notificacion_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Notificacion]:
        models = NotificacionModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_reserva(self, reserva_id: str) -> List[Notificacion]:
        models = NotificacionModel.query.filter_by(id_reserva=reserva_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, notificacion: Notificacion) -> Notificacion:
        model = NotificacionModel.query.get(notificacion.id)
        if model:
            model.fecha_notif = notificacion.fecha_notif
            model.titulo = notificacion.titulo
            model.descripcion = notificacion.descripcion
            model.id_reserva = notificacion.id_reserva
            db.session.commit()
        return notificacion

    def delete(self, notificacion_id: str) -> bool:
        model = NotificacionModel.query.get(notificacion_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: NotificacionModel) -> Notificacion:
        return Notificacion(
            id=model.id,
            fecha_notif=model.fecha_notif,
            titulo=model.titulo,
            descripcion=model.descripcion,
            id_reserva=model.id_reserva
        )
