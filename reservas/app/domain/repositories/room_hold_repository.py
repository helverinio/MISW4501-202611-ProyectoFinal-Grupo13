from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime
from app.domain.entities.room_hold import RoomHold


class RoomHoldRepository(ABC):
    @abstractmethod
    def save(self, room_hold: RoomHold) -> RoomHold:
        pass

    @abstractmethod
    def find_by_id(self, hold_id: str) -> Optional[RoomHold]:
        pass

    @abstractmethod
    def find_active_hold_for_room(
        self, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> Optional[RoomHold]:
        pass

    @abstractmethod
    def find_active_hold_by_user_and_room(
        self, id_usuario: str, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> Optional[RoomHold]:
        pass

    @abstractmethod
    def delete(self, hold_id: str) -> bool:
        pass

    @abstractmethod
    def delete_expired(self) -> int:
        pass

    @abstractmethod
    def acquire_hold_atomically(
        self, id_habitacion: str, id_usuario: str, fecha_ingreso: datetime,
        fecha_salida: datetime, hold_duration_minutes: int
    ) -> Optional[RoomHold]:
        pass
