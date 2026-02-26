from typing import List, Optional
from datetime import datetime
from app.domain.entities.pago import Pago
from app.domain.repositories.pago_repository import PagoRepository


class CreatePagoUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self, fecha_pago: datetime, total: float, estado: str,
                id_pais: str, id_reserva: str) -> Pago:
        pago = Pago.create(fecha_pago, total, estado, id_pais, id_reserva)
        return self.repository.save(pago)


class GetPagoUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self, pago_id: str) -> Optional[Pago]:
        return self.repository.find_by_id(pago_id)


class GetAllPagosUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self) -> List[Pago]:
        return self.repository.find_all()


class GetPagosByReservaUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self, reserva_id: str) -> List[Pago]:
        return self.repository.find_by_reserva(reserva_id)


class UpdatePagoUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self, pago_id: str, **kwargs) -> Optional[Pago]:
        pago = self.repository.find_by_id(pago_id)
        if not pago:
            return None
        if 'fecha_pago' in kwargs:
            pago.fecha_pago = kwargs['fecha_pago']
        if 'total' in kwargs:
            pago.total = kwargs['total']
        if 'estado' in kwargs:
            pago.estado = kwargs['estado']
        if 'id_pais' in kwargs:
            pago.id_pais = kwargs['id_pais']
        if 'id_reserva' in kwargs:
            pago.id_reserva = kwargs['id_reserva']
        return self.repository.update(pago)


class DeletePagoUseCase:
    def __init__(self, repository: PagoRepository):
        self.repository = repository

    def execute(self, pago_id: str) -> bool:
        return self.repository.delete(pago_id)
