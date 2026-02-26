from typing import List, Optional
from datetime import datetime
from app.domain.entities.reserva import Reserva
from app.domain.repositories.reserva_repository import ReservaRepository


class CreateReservaUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, fecha_ingreso: datetime, fecha_salida: datetime,
                total: float, nro_personas: int, id_usuario: str,
                id_pais: str, id_habitacion: str, id_estado: str) -> Reserva:
        reserva = Reserva.create(
            fecha_ingreso, fecha_salida, total, nro_personas,
            id_usuario, id_pais, id_habitacion, id_estado
        )
        return self.repository.save(reserva)


class GetReservaUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, reserva_id: str) -> Optional[Reserva]:
        return self.repository.find_by_id(reserva_id)


class GetAllReservasUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self) -> List[Reserva]:
        return self.repository.find_all()


class GetReservasByUsuarioUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, usuario_id: str) -> List[Reserva]:
        return self.repository.find_by_usuario(usuario_id)


class GetReservasByHabitacionUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, habitacion_id: str) -> List[Reserva]:
        return self.repository.find_by_habitacion(habitacion_id)


class UpdateReservaUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, reserva_id: str, **kwargs) -> Optional[Reserva]:
        reserva = self.repository.find_by_id(reserva_id)
        if not reserva:
            return None
        if 'fecha_ingreso' in kwargs:
            reserva.fecha_ingreso = kwargs['fecha_ingreso']
        if 'fecha_salida' in kwargs:
            reserva.fecha_salida = kwargs['fecha_salida']
        if 'total' in kwargs:
            reserva.total = kwargs['total']
        if 'nro_personas' in kwargs:
            reserva.nro_personas = kwargs['nro_personas']
        if 'id_usuario' in kwargs:
            reserva.id_usuario = kwargs['id_usuario']
        if 'id_pais' in kwargs:
            reserva.id_pais = kwargs['id_pais']
        if 'id_habitacion' in kwargs:
            reserva.id_habitacion = kwargs['id_habitacion']
        if 'id_estado' in kwargs:
            reserva.id_estado = kwargs['id_estado']
        return self.repository.update(reserva)


class DeleteReservaUseCase:
    def __init__(self, repository: ReservaRepository):
        self.repository = repository

    def execute(self, reserva_id: str) -> bool:
        return self.repository.delete(reserva_id)
