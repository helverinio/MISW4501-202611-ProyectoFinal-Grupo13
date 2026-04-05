import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app import db
from app.domain.repositories.pricing_repository import PricingRepository
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.tipo_habitacion_model import TipoHabitacionModel
from app.infrastructure.models.regla_tarifaria_model import ReglaTarifariaModel
from app.infrastructure.models.cotizacion_model import CotizacionModel
from app.infrastructure.models.cotizacion_detalle_model import CotizacionDetalleModel
from app.infrastructure.models.reserva_detalle_tarifa_model import ReservaDetalleTarifaModel


class SQLAlchemyPricingRepository(PricingRepository):
    def get_habitacion_context(self, habitacion_id: str) -> Optional[Dict]:
        habitacion = HabitacionModel.query.get(habitacion_id)
        if not habitacion:
            return None

        id_tipo_habitacion = habitacion.id_tipo_habitacion
        if not id_tipo_habitacion:
            tipo = TipoHabitacionModel.query.filter_by(
                id_hotel=habitacion.id_hotel,
                nombre=habitacion.tipo
            ).first()
            if tipo:
                id_tipo_habitacion = tipo.id

        return {
            'habitacion_id': habitacion.id,
            'id_tipo_habitacion': id_tipo_habitacion,
            'id_hotel': habitacion.id_hotel,
            'tipo': habitacion.tipo
        }

    def get_candidate_rules(self, id_tipo_habitacion: str) -> List[Dict]:
        reglas = db.session.query(ReglaTarifariaModel).join(
            ReglaTarifariaModel.plan_tarifario
        ).filter(
            ReglaTarifariaModel.activo.is_(True),
            ReglaTarifariaModel.plan_tarifario.has(id_tipo_habitacion=id_tipo_habitacion),
            ReglaTarifariaModel.plan_tarifario.has(activo=True),
            ReglaTarifariaModel.plan_tarifario.has(moneda='USD')
        ).all()

        return [
            {
                'id': r.id,
                'id_plan_tarifario': r.id_plan_tarifario,
                'id_temporada': r.id_temporada,
                'fecha_inicio': r.fecha_inicio,
                'fecha_fin': r.fecha_fin,
                'dias_semana_mask': r.dias_semana_mask,
                'precio_base_noche': r.precio_base_noche,
                'prioridad': r.prioridad,
                'min_noches': r.min_noches,
                'combinable': r.combinable,
                'plan_moneda': r.plan_tarifario.moneda,
                'temporada_detalles': [
                    {
                        'fecha_inicio': d.fecha_inicio,
                        'fecha_fin': d.fecha_fin
                    }
                    for d in (r.temporada.detalles if r.temporada else [])
                ]
            }
            for r in reglas
        ]

    def save_cotizacion(
        self,
        id_usuario: str,
        id_habitacion: str,
        fecha_ingreso,
        fecha_salida,
        nro_personas: int,
        total: float,
        moneda: str,
        detalle_noches: List[Dict],
        expires_at: Optional[datetime] = None
    ) -> Dict:
        cotizacion_id = str(uuid.uuid4())
        model = CotizacionModel(
            id=cotizacion_id,
            id_usuario=id_usuario,
            id_habitacion=id_habitacion,
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            nro_personas=nro_personas,
            total=total,
            moneda=moneda,
            created_at=datetime.utcnow(),
            expires_at=expires_at or (datetime.utcnow() + timedelta(minutes=30))
        )
        db.session.add(model)

        for night in detalle_noches:
            db.session.add(CotizacionDetalleModel(
                id=str(uuid.uuid4()),
                id_cotizacion=cotizacion_id,
                fecha_noche=night['fecha_noche'],
                id_plan_tarifario=night['id_plan_tarifario'],
                id_regla_tarifaria=night['id_regla_tarifaria'],
                precio_noche=night['precio_noche'],
                subtotal_noche=night['subtotal_noche']
            ))

        db.session.commit()
        return self.get_cotizacion_with_detalle(cotizacion_id)

    def get_cotizacion_with_detalle(self, cotizacion_id: str) -> Optional[Dict]:
        cotizacion = CotizacionModel.query.get(cotizacion_id)
        if not cotizacion:
            return None

        detalles = CotizacionDetalleModel.query.filter_by(id_cotizacion=cotizacion_id).order_by(
            CotizacionDetalleModel.fecha_noche.asc()
        ).all()

        return {
            'id': cotizacion.id,
            'id_usuario': cotizacion.id_usuario,
            'id_habitacion': cotizacion.id_habitacion,
            'fecha_ingreso': cotizacion.fecha_ingreso,
            'fecha_salida': cotizacion.fecha_salida,
            'nro_personas': cotizacion.nro_personas,
            'total': cotizacion.total,
            'moneda': cotizacion.moneda,
            'created_at': cotizacion.created_at,
            'expires_at': cotizacion.expires_at,
            'detalle_noches': [
                {
                    'id': d.id,
                    'fecha_noche': d.fecha_noche,
                    'id_plan_tarifario': d.id_plan_tarifario,
                    'id_regla_tarifaria': d.id_regla_tarifaria,
                    'precio_noche': d.precio_noche,
                    'subtotal_noche': d.subtotal_noche
                }
                for d in detalles
            ]
        }

    def save_reserva_tarifa_snapshot(self, id_reserva: str, detalle_noches: List[Dict]) -> None:
        for night in detalle_noches:
            db.session.add(ReservaDetalleTarifaModel(
                id=str(uuid.uuid4()),
                id_reserva=id_reserva,
                fecha_noche=night['fecha_noche'],
                id_plan_tarifario=night['id_plan_tarifario'],
                id_regla_tarifaria=night['id_regla_tarifaria'],
                precio_noche=night['precio_noche'],
                subtotal_noche=night['subtotal_noche']
            ))
        db.session.commit()
