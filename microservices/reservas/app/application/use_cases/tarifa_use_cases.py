from typing import List, Optional
from app.domain.entities.tarifa import Tarifa
from app.domain.repositories.tarifa_repository import TarifaRepository


class CreateTarifaUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self, nombre: str, valor: float, descuento: float,
                id_habitacion: str) -> Tarifa:
        tarifa = Tarifa.create(nombre, valor, descuento, id_habitacion)
        return self.repository.save(tarifa)


class GetTarifaUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self, tarifa_id: str) -> Optional[Tarifa]:
        return self.repository.find_by_id(tarifa_id)


class GetAllTarifasUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self) -> List[Tarifa]:
        return self.repository.find_all()


class GetTarifasByHabitacionUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self, habitacion_id: str) -> List[Tarifa]:
        return self.repository.find_by_habitacion(habitacion_id)


class UpdateTarifaUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self, tarifa_id: str, **kwargs) -> Optional[Tarifa]:
        tarifa = self.repository.find_by_id(tarifa_id)
        if not tarifa:
            return None
        if 'nombre' in kwargs:
            tarifa.nombre = kwargs['nombre']
        if 'valor' in kwargs:
            tarifa.valor = kwargs['valor']
        if 'descuento' in kwargs:
            tarifa.descuento = kwargs['descuento']
        if 'id_habitacion' in kwargs:
            tarifa.id_habitacion = kwargs['id_habitacion']
        return self.repository.update(tarifa)


class DeleteTarifaUseCase:
    def __init__(self, repository: TarifaRepository):
        self.repository = repository

    def execute(self, tarifa_id: str) -> bool:
        return self.repository.delete(tarifa_id)
