from typing import List, Optional
from app import db
from app.domain.entities.hotel import Hotel
from app.domain.repositories.hotel_repository import HotelRepository
from app.infrastructure.models.hotel_model import HotelModel


class SQLAlchemyHotelRepository(HotelRepository):
    def save(self, hotel: Hotel) -> Hotel:
        model = HotelModel(
            id=hotel.id,
            nombre=hotel.nombre,
            email=hotel.email,
            descripcion=hotel.descripcion,
            amenidades=hotel.amenidades,
            id_ciudad=hotel.id_ciudad
        )
        db.session.add(model)
        db.session.commit()
        return hotel

    def find_by_id(self, hotel_id: str) -> Optional[Hotel]:
        model = HotelModel.query.get(hotel_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Hotel]:
        models = HotelModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_ciudad(self, ciudad_id: str) -> List[Hotel]:
        models = HotelModel.query.filter_by(id_ciudad=ciudad_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, hotel: Hotel) -> Hotel:
        model = HotelModel.query.get(hotel.id)
        if model:
            model.nombre = hotel.nombre
            model.email = hotel.email
            model.descripcion = hotel.descripcion
            model.amenidades = hotel.amenidades
            model.id_ciudad = hotel.id_ciudad
            db.session.commit()
        return hotel

    def delete(self, hotel_id: str) -> bool:
        model = HotelModel.query.get(hotel_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: HotelModel) -> Hotel:
        return Hotel(
            id=model.id,
            nombre=model.nombre,
            email=model.email,
            descripcion=model.descripcion,
            amenidades=model.amenidades,
            id_ciudad=model.id_ciudad
        )
