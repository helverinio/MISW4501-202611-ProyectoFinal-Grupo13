from typing import List, Optional
from app.domain.entities.hotel import Hotel
from app.domain.repositories.hotel_repository import HotelRepository


class CreateHotelUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self, nombre: str, email: str, id_ciudad: str,
                descripcion: Optional[str] = None,
                amenidades: Optional[str] = None) -> Hotel:
        hotel = Hotel.create(nombre, email, id_ciudad, descripcion, amenidades)
        return self.repository.save(hotel)


class GetHotelUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self, hotel_id: str) -> Optional[Hotel]:
        return self.repository.find_by_id(hotel_id)


class GetAllHotelesUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self) -> List[Hotel]:
        return self.repository.find_all()


class GetHotelesByCiudadUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self, ciudad_id: str) -> List[Hotel]:
        return self.repository.find_by_ciudad(ciudad_id)


class UpdateHotelUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self, hotel_id: str, **kwargs) -> Optional[Hotel]:
        hotel = self.repository.find_by_id(hotel_id)
        if not hotel:
            return None
        if 'nombre' in kwargs:
            hotel.nombre = kwargs['nombre']
        if 'email' in kwargs:
            hotel.email = kwargs['email']
        if 'descripcion' in kwargs:
            hotel.descripcion = kwargs['descripcion']
        if 'amenidades' in kwargs:
            hotel.amenidades = kwargs['amenidades']
        if 'id_ciudad' in kwargs:
            hotel.id_ciudad = kwargs['id_ciudad']
        return self.repository.update(hotel)


class DeleteHotelUseCase:
    def __init__(self, repository: HotelRepository):
        self.repository = repository

    def execute(self, hotel_id: str) -> bool:
        return self.repository.delete(hotel_id)
