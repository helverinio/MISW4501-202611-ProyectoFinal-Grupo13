from typing import List, Optional
from app import db
from app.domain.entities.estado import Estado
from app.domain.repositories.estado_repository import EstadoRepository
from app.infrastructure.models.estado_model import EstadoModel


class SQLAlchemyEstadoRepository(EstadoRepository):
    def save(self, estado: Estado) -> Estado:
        model = EstadoModel(
            id=estado.id,
            nombre=estado.nombre,
            descripcion=estado.descripcion
        )
        db.session.add(model)
        db.session.commit()
        return estado

    def find_by_id(self, estado_id: str) -> Optional[Estado]:
        model = EstadoModel.query.get(estado_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Estado]:
        models = EstadoModel.query.all()
        return [self._to_entity(m) for m in models]

    def update(self, estado: Estado) -> Estado:
        model = EstadoModel.query.get(estado.id)
        if model:
            model.nombre = estado.nombre
            model.descripcion = estado.descripcion
            db.session.commit()
        return estado

    def delete(self, estado_id: str) -> bool:
        model = EstadoModel.query.get(estado_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def find_by_nombre(self, nombre: str) -> Optional[Estado]:
        model = EstadoModel.query.filter_by(nombre=nombre).first()
        if not model:
            return None
        return self._to_entity(model)

    def _to_entity(self, model: EstadoModel) -> Estado:
        return Estado(
            id=model.id,
            nombre=model.nombre,
            descripcion=model.descripcion
        )
