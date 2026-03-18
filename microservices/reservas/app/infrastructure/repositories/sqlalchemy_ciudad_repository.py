from typing import List, Optional
from app import db
from app.domain.entities.ciudad import Ciudad
from app.domain.repositories.ciudad_repository import CiudadRepository
from app.infrastructure.models.ciudad_model import CiudadModel


class SQLAlchemyCiudadRepository(CiudadRepository):
    def save(self, ciudad: Ciudad) -> Ciudad:
        model = CiudadModel(
            id=ciudad.id,
            nombre=ciudad.nombre,
            id_pais=ciudad.id_pais
        )
        db.session.add(model)
        db.session.commit()
        return ciudad

    def find_by_id(self, ciudad_id: str) -> Optional[Ciudad]:
        model = CiudadModel.query.get(ciudad_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Ciudad]:
        models = CiudadModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_pais(self, pais_id: str) -> List[Ciudad]:
        models = CiudadModel.query.filter_by(id_pais=pais_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, ciudad: Ciudad) -> Ciudad:
        model = CiudadModel.query.get(ciudad.id)
        if model:
            model.nombre = ciudad.nombre
            model.id_pais = ciudad.id_pais
            db.session.commit()
        return ciudad

    def delete(self, ciudad_id: str) -> bool:
        model = CiudadModel.query.get(ciudad_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: CiudadModel) -> Ciudad:
        return Ciudad(
            id=model.id,
            nombre=model.nombre,
            id_pais=model.id_pais
        )
