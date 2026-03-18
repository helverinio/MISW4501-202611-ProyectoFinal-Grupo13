from typing import List, Optional
from app.domain.entities.pais import Pais
from app.domain.repositories.pais_repository import PaisRepository


class CreatePaisUseCase:
    def __init__(self, repository: PaisRepository):
        self.repository = repository

    def execute(self, nombre: str) -> Pais:
        pais = Pais.create(nombre)
        return self.repository.save(pais)


class GetPaisUseCase:
    def __init__(self, repository: PaisRepository):
        self.repository = repository

    def execute(self, pais_id: str) -> Optional[Pais]:
        return self.repository.find_by_id(pais_id)


class GetAllPaisesUseCase:
    def __init__(self, repository: PaisRepository):
        self.repository = repository

    def execute(self) -> List[Pais]:
        return self.repository.find_all()


class UpdatePaisUseCase:
    def __init__(self, repository: PaisRepository):
        self.repository = repository

    def execute(self, pais_id: str, **kwargs) -> Optional[Pais]:
        pais = self.repository.find_by_id(pais_id)
        if not pais:
            return None
        if 'nombre' in kwargs:
            pais.nombre = kwargs['nombre']
        return self.repository.update(pais)


class DeletePaisUseCase:
    def __init__(self, repository: PaisRepository):
        self.repository = repository

    def execute(self, pais_id: str) -> bool:
        return self.repository.delete(pais_id)
