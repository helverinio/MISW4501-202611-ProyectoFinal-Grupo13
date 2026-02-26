from typing import List, Optional
from app.domain.entities.estado import Estado
from app.domain.repositories.estado_repository import EstadoRepository


class CreateEstadoUseCase:
    def __init__(self, repository: EstadoRepository):
        self.repository = repository

    def execute(self, nombre: str, descripcion: Optional[str] = None) -> Estado:
        estado = Estado.create(nombre, descripcion)
        return self.repository.save(estado)


class GetEstadoUseCase:
    def __init__(self, repository: EstadoRepository):
        self.repository = repository

    def execute(self, estado_id: str) -> Optional[Estado]:
        return self.repository.find_by_id(estado_id)


class GetAllEstadosUseCase:
    def __init__(self, repository: EstadoRepository):
        self.repository = repository

    def execute(self) -> List[Estado]:
        return self.repository.find_all()


class UpdateEstadoUseCase:
    def __init__(self, repository: EstadoRepository):
        self.repository = repository

    def execute(self, estado_id: str, **kwargs) -> Optional[Estado]:
        estado = self.repository.find_by_id(estado_id)
        if not estado:
            return None
        if 'nombre' in kwargs:
            estado.nombre = kwargs['nombre']
        if 'descripcion' in kwargs:
            estado.descripcion = kwargs['descripcion']
        return self.repository.update(estado)


class DeleteEstadoUseCase:
    def __init__(self, repository: EstadoRepository):
        self.repository = repository

    def execute(self, estado_id: str) -> bool:
        return self.repository.delete(estado_id)
