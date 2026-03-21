from typing import Optional
from datetime import datetime
from app.domain.entities.room_hold import RoomHold
from app.domain.repositories.room_hold_repository import RoomHoldRepository
from app.config.constants import DEFAULT_HOLD_DURATION_MINUTES


class AcquireRoomHoldUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(
        self, id_habitacion: str, id_usuario: str, fecha_ingreso: datetime,
        fecha_salida: datetime, hold_duration_minutes: int = DEFAULT_HOLD_DURATION_MINUTES
    ) -> Optional[RoomHold]:
        return self.repository.acquire_hold_atomically(
            id_habitacion=id_habitacion,
            id_usuario=id_usuario,
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            hold_duration_minutes=hold_duration_minutes
        )


class GetRoomHoldUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(self, hold_id: str) -> Optional[RoomHold]:
        return self.repository.find_by_id(hold_id)


class CheckRoomHoldUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(
        self, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> Optional[RoomHold]:
        return self.repository.find_active_hold_for_room(
            id_habitacion, fecha_ingreso, fecha_salida
        )


class ValidateUserHoldUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(
        self, id_usuario: str, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> bool:
        hold = self.repository.find_active_hold_by_user_and_room(
            id_usuario, id_habitacion, fecha_ingreso, fecha_salida
        )
        return hold is not None and hold.is_active()


class ReleaseRoomHoldUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(self, hold_id: str) -> bool:
        return self.repository.delete(hold_id)


class CleanupExpiredHoldsUseCase:
    def __init__(self, repository: RoomHoldRepository):
        self.repository = repository

    def execute(self) -> int:
        return self.repository.delete_expired()
