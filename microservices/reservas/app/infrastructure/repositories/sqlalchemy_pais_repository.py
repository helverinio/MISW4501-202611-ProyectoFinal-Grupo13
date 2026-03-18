from typing import List, Optional
from app import db
from app.domain.entities.pais import Pais
from app.domain.repositories.pais_repository import PaisRepository
from app.infrastructure.models.pais_model import PaisModel


class SQLAlchemyPaisRepository(PaisRepository):
    def save(self, pais: Pais) -> Pais:
        model = PaisModel(
            id=pais.id,
            nombre=pais.nombre
        )
        db.session.add(model)
        db.session.commit()
        return pais

    def find_by_id(self, pais_id: str) -> Optional[Pais]:
        model = PaisModel.query.get(pais_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Pais]:
        models = PaisModel.query.all()
        return [self._to_entity(m) for m in models]

    def update(self, pais: Pais) -> Pais:
        model = PaisModel.query.get(pais.id)
        if model:
            model.nombre = pais.nombre
            db.session.commit()
        return pais

    def delete(self, pais_id: str) -> bool:
        model = PaisModel.query.get(pais_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: PaisModel) -> Pais:
        return Pais(
            id=model.id,
            nombre=model.nombre
        )
