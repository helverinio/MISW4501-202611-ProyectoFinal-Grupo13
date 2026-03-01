from typing import Optional
from datetime import datetime
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from app import db
from app.domain.entities.room_hold import RoomHold
from app.domain.repositories.room_hold_repository import RoomHoldRepository
from app.infrastructure.models.room_hold_model import RoomHoldModel


class SQLAlchemyRoomHoldRepository(RoomHoldRepository):
    def save(self, room_hold: RoomHold) -> RoomHold:
        model = RoomHoldModel(
            id=room_hold.id,
            id_habitacion=room_hold.id_habitacion,
            id_usuario=room_hold.id_usuario,
            fecha_ingreso=room_hold.fecha_ingreso,
            fecha_salida=room_hold.fecha_salida,
            created_at=room_hold.created_at,
            expires_at=room_hold.expires_at
        )
        db.session.add(model)
        db.session.commit()
        return room_hold

    def find_by_id(self, hold_id: str) -> Optional[RoomHold]:
        model = RoomHoldModel.query.get(hold_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_active_hold_for_room(
        self, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> Optional[RoomHold]:
        now = datetime.utcnow()
        model = RoomHoldModel.query.filter(
            and_(
                RoomHoldModel.id_habitacion == id_habitacion,
                RoomHoldModel.expires_at > now,
                RoomHoldModel.fecha_ingreso < fecha_salida,
                RoomHoldModel.fecha_salida > fecha_ingreso
            )
        ).first()
        if not model:
            return None
        return self._to_entity(model)

    def find_active_hold_by_user_and_room(
        self, id_usuario: str, id_habitacion: str, fecha_ingreso: datetime, fecha_salida: datetime
    ) -> Optional[RoomHold]:
        now = datetime.utcnow()
        model = RoomHoldModel.query.filter(
            and_(
                RoomHoldModel.id_habitacion == id_habitacion,
                RoomHoldModel.id_usuario == id_usuario,
                RoomHoldModel.expires_at > now,
                RoomHoldModel.fecha_ingreso < fecha_salida,
                RoomHoldModel.fecha_salida > fecha_ingreso
            )
        ).first()
        if not model:
            return None
        return self._to_entity(model)

    def delete(self, hold_id: str) -> bool:
        model = RoomHoldModel.query.get(hold_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def delete_expired(self) -> int:
        now = datetime.utcnow()
        deleted_count = RoomHoldModel.query.filter(
            RoomHoldModel.expires_at <= now
        ).delete()
        db.session.commit()
        return deleted_count

    def acquire_hold_atomically(
        self, id_habitacion: str, id_usuario: str, fecha_ingreso: datetime,
        fecha_salida: datetime, hold_duration_minutes: int = 15
    ) -> Optional[RoomHold]:
        now = datetime.utcnow()
        
        try:
            existing_hold = RoomHoldModel.query.filter(
                and_(
                    RoomHoldModel.id_habitacion == id_habitacion,
                    RoomHoldModel.expires_at > now,
                    RoomHoldModel.fecha_ingreso < fecha_salida,
                    RoomHoldModel.fecha_salida > fecha_ingreso
                )
            ).with_for_update(nowait=True).first()

            if existing_hold:
                if existing_hold.id_usuario == id_usuario:
                    return self._to_entity(existing_hold)
                return None

            room_hold = RoomHold.create(
                id_habitacion=id_habitacion,
                id_usuario=id_usuario,
                fecha_ingreso=fecha_ingreso,
                fecha_salida=fecha_salida,
                hold_duration_minutes=hold_duration_minutes
            )

            model = RoomHoldModel(
                id=room_hold.id,
                id_habitacion=room_hold.id_habitacion,
                id_usuario=room_hold.id_usuario,
                fecha_ingreso=room_hold.fecha_ingreso,
                fecha_salida=room_hold.fecha_salida,
                created_at=room_hold.created_at,
                expires_at=room_hold.expires_at
            )
            db.session.add(model)
            db.session.commit()
            return room_hold

        except IntegrityError:
            db.session.rollback()
            return None

    def _to_entity(self, model: RoomHoldModel) -> RoomHold:
        return RoomHold(
            id=model.id,
            id_habitacion=model.id_habitacion,
            id_usuario=model.id_usuario,
            fecha_ingreso=model.fecha_ingreso,
            fecha_salida=model.fecha_salida,
            created_at=model.created_at,
            expires_at=model.expires_at
        )
