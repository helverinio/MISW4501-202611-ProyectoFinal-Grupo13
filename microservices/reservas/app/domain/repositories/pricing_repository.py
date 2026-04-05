from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Dict, List, Optional


class PricingRepository(ABC):
    @abstractmethod
    def get_habitacion_context(self, habitacion_id: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def get_candidate_rules(self, id_tipo_habitacion: str) -> List[Dict]:
        pass

    @abstractmethod
    def save_cotizacion(
        self,
        id_usuario: str,
        id_habitacion: str,
        fecha_ingreso: date,
        fecha_salida: date,
        nro_personas: int,
        total: float,
        moneda: str,
        detalle_noches: List[Dict],
        expires_at: Optional[datetime] = None
    ) -> Dict:
        pass

    @abstractmethod
    def get_cotizacion_with_detalle(self, cotizacion_id: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def save_reserva_tarifa_snapshot(self, id_reserva: str, detalle_noches: List[Dict]) -> None:
        pass
