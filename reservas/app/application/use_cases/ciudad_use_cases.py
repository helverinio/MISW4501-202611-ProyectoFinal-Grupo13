from typing import List, Optional
from app.domain.entities.ciudad import Ciudad
from app.domain.repositories.ciudad_repository import CiudadRepository


class CreateCiudadUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self, nombre: str, id_pais: str) -> Ciudad:
        ciudad = Ciudad.create(nombre, id_pais)
        return self.repository.save(ciudad)


class GetCiudadUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self, ciudad_id: str) -> Optional[Ciudad]:
        return self.repository.find_by_id(ciudad_id)


class GetAllCiudadesUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self) -> List[Ciudad]:
        return self.repository.find_all()


class GetCiudadesByPaisUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self, pais_id: str) -> List[Ciudad]:
        return self.repository.find_by_pais(pais_id)


class UpdateCiudadUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self, ciudad_id: str, **kwargs) -> Optional[Ciudad]:
        ciudad = self.repository.find_by_id(ciudad_id)
        if not ciudad:
            return None
        if 'nombre' in kwargs:
            ciudad.nombre = kwargs['nombre']
        if 'id_pais' in kwargs:
            ciudad.id_pais = kwargs['id_pais']
        return self.repository.update(ciudad)


class DeleteCiudadUseCase:
    def __init__(self, repository: CiudadRepository):
        self.repository = repository

    def execute(self, ciudad_id: str) -> bool:
        return self.repository.delete(ciudad_id)
