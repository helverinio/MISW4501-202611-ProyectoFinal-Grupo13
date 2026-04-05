from datetime import date, datetime, timedelta

import pytest

from app.application.use_cases.pricing_use_cases import (
    PricingRuleNotFoundError,
    PricingService,
    QuotationService,
)


class InMemoryPricingRepository:
    def __init__(self):
        self._quotes = {}

    def get_habitacion_context(self, habitacion_id: str):
        if habitacion_id == 'hab-1':
            return {
                'habitacion_id': habitacion_id,
                'id_tipo_habitacion': 'tipo-1',
                'id_hotel': 'hotel-1',
                'tipo': 'Suite',
            }
        return None

    def get_candidate_rules(self, id_tipo_habitacion: str):
        if id_tipo_habitacion != 'tipo-1':
            return []
        return [
            {
                'id': 'regla-weekend',
                'id_plan_tarifario': 'plan-1',
                'id_temporada': None,
                'fecha_inicio': None,
                'fecha_fin': None,
                'dias_semana_mask': '5,6',
                'precio_base_noche': 200.0,
                'prioridad': 5,
                'min_noches': None,
                'combinable': False,
                'plan_moneda': 'USD',
                'temporada_detalles': [],
            },
            {
                'id': 'regla-default',
                'id_plan_tarifario': 'plan-1',
                'id_temporada': None,
                'fecha_inicio': None,
                'fecha_fin': None,
                'dias_semana_mask': None,
                'precio_base_noche': 150.0,
                'prioridad': 1,
                'min_noches': None,
                'combinable': False,
                'plan_moneda': 'USD',
                'temporada_detalles': [],
            },
        ]

    def save_cotizacion(
        self,
        id_usuario,
        id_habitacion,
        fecha_ingreso,
        fecha_salida,
        nro_personas,
        total,
        moneda,
        detalle_noches,
        expires_at=None,
    ):
        quote = {
            'id': 'cot-1',
            'id_usuario': id_usuario,
            'id_habitacion': id_habitacion,
            'fecha_ingreso': fecha_ingreso,
            'fecha_salida': fecha_salida,
            'nro_personas': nro_personas,
            'total': total,
            'moneda': moneda,
            'created_at': datetime.utcnow(),
            'expires_at': expires_at or (datetime.utcnow() + timedelta(minutes=30)),
            'detalle_noches': detalle_noches,
        }
        self._quotes[quote['id']] = quote
        return quote

    def get_cotizacion_with_detalle(self, cotizacion_id: str):
        return self._quotes.get(cotizacion_id)

    def save_reserva_tarifa_snapshot(self, id_reserva, detalle_noches):
        return None


def test_pricing_service_calculates_night_by_night_total_in_usd():
    repo = InMemoryPricingRepository()
    service = PricingService(repo)

    result = service.calculate_stay(
        id_habitacion='hab-1',
        fecha_ingreso=date(2026, 4, 3),  # Friday
        fecha_salida=date(2026, 4, 5),
        nro_personas=2,
    )

    assert result['moneda'] == 'USD'
    assert result['noches'] == 2
    assert result['total'] == 350.0
    assert len(result['detalle_noches']) == 2


def test_pricing_service_raises_when_no_rule_applies():
    class EmptyRepo(InMemoryPricingRepository):
        def get_candidate_rules(self, id_tipo_habitacion: str):
            return []

    service = PricingService(EmptyRepo())

    with pytest.raises(PricingRuleNotFoundError):
        service.calculate_stay('hab-1', date(2026, 4, 1), date(2026, 4, 2), 1)


def test_quotation_service_persists_quote_and_validates_expiration():
    repo = InMemoryPricingRepository()
    pricing_service = PricingService(repo)
    quotation_service = QuotationService(repo, pricing_service)

    quote = quotation_service.create_quotation(
        id_usuario='u-1',
        id_habitacion='hab-1',
        fecha_ingreso=date(2026, 4, 1),
        fecha_salida=date(2026, 4, 3),
        nro_personas=2,
    )

    assert quote['id'] == 'cot-1'
    assert quote['total'] == 300.0
    assert quote['moneda'] == 'USD'
    assert quotation_service.is_expired(quote) is False
