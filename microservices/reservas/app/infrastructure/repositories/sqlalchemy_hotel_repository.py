import logging
from typing import List, Optional
from sqlalchemy import or_, func
from app import db
from app.domain.entities.hotel import Hotel
from app.domain.repositories.hotel_repository import HotelRepository
from app.infrastructure.models.hotel_model import HotelModel
from app.infrastructure.models.ciudad_model import CiudadModel
from app.infrastructure.models.pais_model import PaisModel

logger = logging.getLogger(__name__)


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

    def search_by_name_or_ciudad(self, busqueda: str) -> List[Hotel]:
        """Busca hoteles por nombre de hotel, ciudad o pais (sin distincion de tildes)"""
        search_pattern = f"%{busqueda}%"
        logger.info("[HotelRepo] search_by_name_or_ciudad pattern='%s'", search_pattern)
        models = db.session.query(HotelModel).join(
            CiudadModel, HotelModel.id_ciudad == CiudadModel.id
        ).join(
            PaisModel, CiudadModel.id_pais == PaisModel.id
        ).filter(
            or_(
                func.unaccent(HotelModel.nombre).ilike(func.unaccent(search_pattern)),
                func.unaccent(CiudadModel.nombre).ilike(func.unaccent(search_pattern)),
                func.unaccent(PaisModel.nombre).ilike(func.unaccent(search_pattern))
            )
        ).all()
        logger.info("[HotelRepo] Hoteles encontrados: %d - nombres: %s",
                    len(models), [m.nombre for m in models])
        if not models:
            total_hoteles = HotelModel.query.count()
            total_ciudades = CiudadModel.query.count()
            logger.warning("[HotelRepo] Sin resultados. DB tiene %d hoteles y %d ciudades",
                           total_hoteles, total_ciudades)
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
