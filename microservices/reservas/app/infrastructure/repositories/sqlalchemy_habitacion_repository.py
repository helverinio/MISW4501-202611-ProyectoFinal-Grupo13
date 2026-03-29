from typing import List, Optional
from sqlalchemy import and_
from datetime import date
from app import db
from app.domain.entities.habitacion import Habitacion
from app.domain.repositories.habitacion_repository import HabitacionRepository
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.estado_model import EstadoModel


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

    def find_available_by_hotel(
        self, hotel_id: str, fecha_ingreso: date, fecha_salida: date, 
        capacidad_minima: int, confirmed_estado_nombres: List[str]
    ) -> List[Habitacion]:
        """Encuentra habitaciones disponibles en un hotel para fechas y capacidad determinadas"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Obtener IDs de estados confirmados
        confirmed_estado_ids = db.session.query(EstadoModel.id).filter(
            EstadoModel.nombre.in_(confirmed_estado_nombres)
        ).subquery()
        
        # Log de estados encontrados
        estado_ids_list = db.session.query(EstadoModel.id, EstadoModel.nombre).filter(
            EstadoModel.nombre.in_(confirmed_estado_nombres)
        ).all()
        logger.info("[HabitacionRepo] hotel_id=%s | Estados confirmados encontrados en DB: %s",
                    hotel_id, [(str(e.id), e.nombre) for e in estado_ids_list])
        if not estado_ids_list:
            logger.warning("[HabitacionRepo] ADVERTENCIA: Ninguno de los estados %s existe en la tabla estados",
                           confirmed_estado_nombres)

        # Obtener habitaciones del hotel con capacidad suficiente
        habitaciones = HabitacionModel.query.filter(
            HabitacionModel.id_hotel == hotel_id,
            HabitacionModel.capacidad >= capacidad_minima
        ).all()
        logger.info("[HabitacionRepo] hotel_id=%s, capacidad>=%d, date=%s/%s | Habitaciones con capacidad: %d",
                    hotel_id, capacidad_minima, fecha_ingreso, fecha_salida, len(habitaciones))
        
        # Filtrar habitaciones que no tengan reservas confirmadas en las fechas solicitadas
        available_habitaciones = []
        for habitacion in habitaciones:
            # Verificar si existe reserva confirmada que overlap con las fechas
            overlapping = ReservaModel.query.filter(
                and_(
                    ReservaModel.id_habitacion == habitacion.id,
                    ReservaModel.id_estado.in_(confirmed_estado_ids),
                    ReservaModel.fecha_ingreso < fecha_salida,
                    ReservaModel.fecha_salida > fecha_ingreso
                )
            ).first()
            
            if overlapping:
                logger.debug("[HabitacionRepo] Habitacion %s (nro %s) OCUPADA - reserva_id=%s",
                             habitacion.id, habitacion.nro_habitacion, overlapping.id)
            else:
                logger.debug("[HabitacionRepo] Habitacion %s (nro %s) DISPONIBLE",
                             habitacion.id, habitacion.nro_habitacion)
                available_habitaciones.append(self._to_entity(habitacion))
        
        logger.info("[HabitacionRepo] hotel_id=%s | Disponibles: %d / %d",
                    hotel_id, len(available_habitaciones), len(habitaciones))
        return available_habitaciones

    def _to_entity(self, model: HabitacionModel) -> Habitacion:
        return Habitacion(
            id=model.id,
            tipo=model.tipo,
            nro_habitacion=model.nro_habitacion,
            capacidad=model.capacidad,
            camas=model.camas,
            id_hotel=model.id_hotel
        )
