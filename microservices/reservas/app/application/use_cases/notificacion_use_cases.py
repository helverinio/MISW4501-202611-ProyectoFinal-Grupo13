from typing import List, Optional
from datetime import datetime
from app.domain.entities.notificacion import Notificacion
from app.domain.repositories.notificacion_repository import NotificacionRepository


class CreateNotificacionUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, fecha_notif: datetime, titulo: str, id_reserva: str,
                descripcion: Optional[str] = None) -> Notificacion:
        notificacion = Notificacion.create(fecha_notif, titulo, id_reserva, descripcion)
        return self.repository.save(notificacion)


class GetNotificacionUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, notificacion_id: str) -> Optional[Notificacion]:
        return self.repository.find_by_id(notificacion_id)


class GetAllNotificacionesUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self) -> List[Notificacion]:
        return self.repository.find_all()


class GetNotificacionesByReservaUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, reserva_id: str) -> List[Notificacion]:
        return self.repository.find_by_reserva(reserva_id)


class GetNotificacionesByReservaAndTypeUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, reserva_id: str, titulo: str) -> List[Notificacion]:
        return self.repository.find_by_reserva_and_type(reserva_id, titulo)


class UpdateNotificacionUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, notificacion_id: str, **kwargs) -> Optional[Notificacion]:
        notificacion = self.repository.find_by_id(notificacion_id)
        if not notificacion:
            return None
        if 'fecha_notif' in kwargs:
            notificacion.fecha_notif = kwargs['fecha_notif']
        if 'titulo' in kwargs:
            notificacion.titulo = kwargs['titulo']
        if 'descripcion' in kwargs:
            notificacion.descripcion = kwargs['descripcion']
        if 'id_reserva' in kwargs:
            notificacion.id_reserva = kwargs['id_reserva']
        return self.repository.update(notificacion)


class DeleteNotificacionUseCase:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, notificacion_id: str) -> bool:
        return self.repository.delete(notificacion_id)
