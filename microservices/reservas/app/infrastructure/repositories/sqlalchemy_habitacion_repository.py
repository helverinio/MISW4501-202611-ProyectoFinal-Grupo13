from typing import List, Optional
from app import db
from app.domain.entities.habitacion import Habitacion
from app.domain.repositories.habitacion_repository import HabitacionRepository
from app.infrastructure.models.habitacion_model import HabitacionModel


class SQLAlchemyHabitacionRepository(HabitacionRepository):
    def save(self, habitacion: Habitacion) -> Habitacion:
        model = HabitacionModel(
            id=habitacion.id,
            tipo=habitacion.tipo,
            nro_habitacion=habitacion.nro_habitacion,
            capacidad=habitacion.capacidad,
            camas=habitacion.camas,
            id_hotel=habitacion.id_hotel
        )
        db.session.add(model)
        db.session.commit()
        return habitacion

    def find_by_id(self, habitacion_id: str) -> Optional[Habitacion]:
        model = HabitacionModel.query.get(habitacion_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Habitacion]:
        models = HabitacionModel.query.all()
        return [self._to_entity(m) for m in models]

    def find_by_hotel(self, hotel_id: str) -> List[Habitacion]:
        models = HabitacionModel.query.filter_by(id_hotel=hotel_id).all()
        return [self._to_entity(m) for m in models]

    def update(self, habitacion: Habitacion) -> Habitacion:
        model = HabitacionModel.query.get(habitacion.id)
        if model:
            model.tipo = habitacion.tipo
            model.nro_habitacion = habitacion.nro_habitacion
            model.capacidad = habitacion.capacidad
            model.camas = habitacion.camas
            model.id_hotel = habitacion.id_hotel
            db.session.commit()
        return habitacion

    def delete(self, habitacion_id: str) -> bool:
        model = HabitacionModel.query.get(habitacion_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: HabitacionModel) -> Habitacion:
        return Habitacion(
            id=model.id,
            tipo=model.tipo,
            nro_habitacion=model.nro_habitacion,
            capacidad=model.capacidad,
            camas=model.camas,
            id_hotel=model.id_hotel
        )
