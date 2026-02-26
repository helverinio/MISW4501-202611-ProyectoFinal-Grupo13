from typing import List, Optional
from app import db
from app.domain.entities.pago import Pago
from app.domain.repositories.pago_repository import PagoRepository
from app.infrastructure.models.pago_model import PagoModel


class SQLAlchemyPagoRepository(PagoRepository):
    def save(self, pago: Pago) -> Pago:
        model = PagoModel(
            id=pago.id,
            fecha_pago=pago.fecha_pago,
            total=pago.total,
            estado=pago.estado,
            id_pais=pago.id_pais,
            id_reserva=pago.id_reserva
        )
        db.session.add(model)
        db.session.commit()
        return pago

    def find_by_id(self, pago_id: str) -> Optional[Pago]:
        model = PagoModel.query.get(pago_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Pago]:
        models = PagoModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_reserva(self, reserva_id: str) -> List[Pago]:
        models = PagoModel.query.filter_by(id_reserva=reserva_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, pago: Pago) -> Pago:
        model = PagoModel.query.get(pago.id)
        if model:
            model.fecha_pago = pago.fecha_pago
            model.total = pago.total
            model.estado = pago.estado
            model.id_pais = pago.id_pais
            model.id_reserva = pago.id_reserva
            db.session.commit()
        return pago

    def delete(self, pago_id: str) -> bool:
        model = PagoModel.query.get(pago_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: PagoModel) -> Pago:
        return Pago(
            id=model.id,
            fecha_pago=model.fecha_pago,
            total=model.total,
            estado=model.estado,
            id_pais=model.id_pais,
            id_reserva=model.id_reserva
        )
