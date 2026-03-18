from typing import List, Optional
from app import db
from app.domain.entities.tarifa import Tarifa
from app.domain.repositories.tarifa_repository import TarifaRepository
from app.infrastructure.models.tarifa_model import TarifaModel


class SQLAlchemyTarifaRepository(TarifaRepository):
    def save(self, tarifa: Tarifa) -> Tarifa:
        model = TarifaModel(
            id=tarifa.id,
            nombre=tarifa.nombre,
            valor=tarifa.valor,
            descuento=tarifa.descuento,
            id_habitacion=tarifa.id_habitacion
        )
        db.session.add(model)
        db.session.commit()
        return tarifa

    def find_by_id(self, tarifa_id: str) -> Optional[Tarifa]:
        model = TarifaModel.query.get(tarifa_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Tarifa]:
        models = TarifaModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_habitacion(self, habitacion_id: str) -> List[Tarifa]:
        models = TarifaModel.query.filter_by(id_habitacion=habitacion_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, tarifa: Tarifa) -> Tarifa:
        model = TarifaModel.query.get(tarifa.id)
        if model:
            model.nombre = tarifa.nombre
            model.valor = tarifa.valor
            model.descuento = tarifa.descuento
            model.id_habitacion = tarifa.id_habitacion
            db.session.commit()
        return tarifa

    def delete(self, tarifa_id: str) -> bool:
        model = TarifaModel.query.get(tarifa_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: TarifaModel) -> Tarifa:
        return Tarifa(
            id=model.id,
            nombre=model.nombre,
            valor=model.valor,
            descuento=model.descuento,
            id_habitacion=model.id_habitacion
        )
