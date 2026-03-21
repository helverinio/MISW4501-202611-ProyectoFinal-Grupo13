from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.notificacion import Notificacion


class NotificacionRepository(ABC):
    @abstractmethod
    def save(self, notificacion: Notificacion) -> Notificacion:
        pass

    @abstractmethod
    def find_by_id(self, notificacion_id: str) -> Optional[Notificacion]:
        pass

    @abstractmethod
    def find_all(self) -> List[Notificacion]:
        pass

    @abstractmethod
    def find_by_reserva(self, reserva_id: str) -> List[Notificacion]:
        pass

    @abstractmethod
    def update(self, notificacion: Notificacion) -> Notificacion:
        pass

    @abstractmethod
    def delete(self, notificacion_id: str) -> bool:
        pass
