from typing import List, Optional
from app.domain.entities.habitacion import Habitacion
from app.domain.repositories.habitacion_repository import HabitacionRepository


class CreateHabitacionUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self, tipo: str, nro_habitacion: int, capacidad: int,
            camas: int, id_hotel: str, id_tipo_habitacion: Optional[str] = None) -> Habitacion:
        habitacion = Habitacion.create(tipo, nro_habitacion, capacidad, camas, id_hotel, id_tipo_habitacion)
        return self.repository.save(habitacion)


class GetHabitacionUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self, habitacion_id: str) -> Optional[Habitacion]:
        return self.repository.find_by_id(habitacion_id)


class GetAllHabitacionesUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self) -> List[Habitacion]:
        return self.repository.find_all()


class GetHabitacionesByHotelUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self, hotel_id: str) -> List[Habitacion]:
        return self.repository.find_by_hotel(hotel_id)


class UpdateHabitacionUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self, habitacion_id: str, **kwargs) -> Optional[Habitacion]:
        habitacion = self.repository.find_by_id(habitacion_id)
        if not habitacion:
            return None
        if 'tipo' in kwargs:
            habitacion.tipo = kwargs['tipo']
        if 'nro_habitacion' in kwargs:
            habitacion.nro_habitacion = kwargs['nro_habitacion']
        if 'capacidad' in kwargs:
            habitacion.capacidad = kwargs['capacidad']
        if 'camas' in kwargs:
            habitacion.camas = kwargs['camas']
        if 'id_hotel' in kwargs:
            habitacion.id_hotel = kwargs['id_hotel']
        if 'id_tipo_habitacion' in kwargs:
            habitacion.id_tipo_habitacion = kwargs['id_tipo_habitacion']
        return self.repository.update(habitacion)


class DeleteHabitacionUseCase:
    def __init__(self, repository: HabitacionRepository):
        self.repository = repository

    def execute(self, habitacion_id: str) -> bool:
        return self.repository.delete(habitacion_id)
