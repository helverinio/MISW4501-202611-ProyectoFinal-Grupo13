from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
from app.domain.repositories.pricing_repository import PricingRepository


class PricingRuleNotFoundError(Exception):
    pass


class PricingService:
    MONEDA = 'USD'

    def __init__(self, pricing_repository: PricingRepository):
        self.pricing_repository = pricing_repository

    def calculate_stay(
        self,
        id_habitacion: str,
        fecha_ingreso: date,
        fecha_salida: date,
        nro_personas: int
    ) -> Dict:
        if fecha_salida <= fecha_ingreso:
            raise ValueError('fecha_salida debe ser posterior a fecha_ingreso')

        habitacion_context = self.pricing_repository.get_habitacion_context(id_habitacion)
        if not habitacion_context:
            raise ValueError('Habitacion no encontrada')
        if not habitacion_context.get('id_tipo_habitacion'):
            raise PricingRuleNotFoundError(
                'La habitacion no tiene un tipo_habitacion asociado para calcular tarifa'
            )

        stay_nights = (fecha_salida - fecha_ingreso).days
        all_rules = self.pricing_repository.get_candidate_rules(habitacion_context['id_tipo_habitacion'])

        detalle_noches = []
        cursor = fecha_ingreso
        while cursor < fecha_salida:
            aplicables = [
                rule for rule in all_rules
                if self._is_rule_applicable(rule, cursor, stay_nights)
            ]
            if not aplicables:
                raise PricingRuleNotFoundError(
                    f'No existe una regla tarifaria activa para la fecha {cursor.isoformat()} en USD'
                )

            selected = sorted(aplicables, key=self._rule_sort_key)[0]
            detalle_noches.append({
                'fecha_noche': cursor,
                'id_plan_tarifario': selected['id_plan_tarifario'],
                'id_regla_tarifaria': selected['id'],
                'precio_noche': round(float(selected['precio_base_noche']), 2),
                'subtotal_noche': round(float(selected['precio_base_noche']), 2)
            })
            cursor += timedelta(days=1)

        total = round(sum(d['subtotal_noche'] for d in detalle_noches), 2)
        return {
            'id_habitacion': id_habitacion,
            'fecha_ingreso': fecha_ingreso,
            'fecha_salida': fecha_salida,
            'nro_personas': nro_personas,
            'noches': stay_nights,
            'moneda': self.MONEDA,
            'total': total,
            'detalle_noches': detalle_noches
        }

    def _is_rule_applicable(self, rule: Dict, night_date: date, stay_nights: int) -> bool:
        if rule.get('plan_moneda') != self.MONEDA:
            return False

        min_noches = rule.get('min_noches')
        if min_noches is not None and stay_nights < int(min_noches):
            return False

        if rule.get('fecha_inicio') and night_date < rule['fecha_inicio']:
            return False
        if rule.get('fecha_fin') and night_date > rule['fecha_fin']:
            return False

        if rule.get('dias_semana_mask'):
            allowed = {d.strip() for d in rule['dias_semana_mask'].split(',') if d.strip() != ''}
            if str(night_date.weekday()) not in allowed:
                return False

        if rule.get('id_temporada'):
            season_match = False
            for detail in rule.get('temporada_detalles', []):
                if detail['fecha_inicio'] <= night_date <= detail['fecha_fin']:
                    season_match = True
                    break
            if not season_match:
                return False

        return True

    def _rule_sort_key(self, rule: Dict):
        has_season = 1 if rule.get('id_temporada') else 0
        has_date_range = 1 if (rule.get('fecha_inicio') and rule.get('fecha_fin')) else 0
        range_span = 99999
        if has_date_range:
            range_span = (rule['fecha_fin'] - rule['fecha_inicio']).days

        # Prefer season > date range specificity > explicit priority
        return (-has_season, -has_date_range, range_span, -int(rule.get('prioridad', 0)))


class QuotationService:
    def __init__(self, pricing_repository: PricingRepository, pricing_service: PricingService):
        self.pricing_repository = pricing_repository
        self.pricing_service = pricing_service

    def create_quotation(
        self,
        id_usuario: str,
        id_habitacion: str,
        fecha_ingreso: date,
        fecha_salida: date,
        nro_personas: int
    ) -> Dict:
        quote = self.pricing_service.calculate_stay(
            id_habitacion=id_habitacion,
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            nro_personas=nro_personas
        )
        return self.pricing_repository.save_cotizacion(
            id_usuario=id_usuario,
            id_habitacion=id_habitacion,
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            nro_personas=nro_personas,
            total=quote['total'],
            moneda=quote['moneda'],
            detalle_noches=quote['detalle_noches'],
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )

    def get_quotation(self, cotizacion_id: str) -> Optional[Dict]:
        return self.pricing_repository.get_cotizacion_with_detalle(cotizacion_id)

    def is_expired(self, quote: Dict) -> bool:
        return datetime.utcnow() > quote['expires_at']
