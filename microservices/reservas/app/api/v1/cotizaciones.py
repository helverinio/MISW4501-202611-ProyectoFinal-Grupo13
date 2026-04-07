from datetime import datetime
from flask import jsonify, request
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases.pricing_use_cases import (
    PricingRuleNotFoundError,
    PricingService,
    QuotationService,
)
from app.infrastructure.repositories.sqlalchemy_pricing_repository import SQLAlchemyPricingRepository


def _build_services():
    pricing_repo = SQLAlchemyPricingRepository()
    pricing_service = PricingService(pricing_repo)
    quotation_service = QuotationService(pricing_repo, pricing_service)
    return pricing_service, quotation_service


def _parse_date(date_text: str):
    return datetime.strptime(date_text, '%Y-%m-%d').date()


@api_v1_bp.route('/cotizaciones', methods=['POST'])
@require_token
def create_cotizacion(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['id_usuario', 'id_habitacion', 'fecha_ingreso', 'fecha_salida', 'nro_personas']
    if not all(data.get(field) is not None for field in required):
        return jsonify({'error': f"Campos requeridos: {', '.join(required)}"}), 400

    try:
        fecha_ingreso = _parse_date(data['fecha_ingreso'])
        fecha_salida = _parse_date(data['fecha_salida'])
        nro_personas = int(data['nro_personas'])
    except (ValueError, TypeError):
        return jsonify({'error': 'fecha_ingreso/fecha_salida deben usar YYYY-MM-DD y nro_personas debe ser numérico'}), 400

    if nro_personas < 1:
        return jsonify({'error': 'nro_personas debe ser mayor a 0'}), 400

    _, quotation_service = _build_services()
    try:
        quote = quotation_service.create_quotation(
            id_usuario=data['id_usuario'],
            id_habitacion=data['id_habitacion'],
            fecha_ingreso=fecha_ingreso,
            fecha_salida=fecha_salida,
            nro_personas=nro_personas,
        )
    except PricingRuleNotFoundError as ex:
        return jsonify({'error': str(ex)}), 422
    except ValueError as ex:
        return jsonify({'error': str(ex)}), 400

    return jsonify(_serialize_quote(quote)), 201


@api_v1_bp.route('/cotizaciones/<cotizacion_id>', methods=['GET'])
@require_token
def get_cotizacion(cotizacion_id, current_usuario=None):
    _, quotation_service = _build_services()
    quote = quotation_service.get_quotation(cotizacion_id)
    if not quote:
        return jsonify({'error': 'Cotizacion not found'}), 404

    payload = _serialize_quote(quote)
    payload['expirada'] = quotation_service.is_expired(quote)
    return jsonify(payload), 200


def _serialize_quote(quote):
    return {
        'id': quote['id'],
        'id_usuario': quote['id_usuario'],
        'id_habitacion': quote['id_habitacion'],
        'fecha_ingreso': quote['fecha_ingreso'].isoformat(),
        'fecha_salida': quote['fecha_salida'].isoformat(),
        'nro_personas': quote['nro_personas'],
        'total': quote['total'],
        'moneda': quote['moneda'],
        'created_at': quote['created_at'].isoformat(),
        'expires_at': quote['expires_at'].isoformat(),
        'detalle_noches': [
            {
                'fecha_noche': n['fecha_noche'].isoformat(),
                'id_plan_tarifario': n['id_plan_tarifario'],
                'id_regla_tarifaria': n['id_regla_tarifaria'],
                'precio_noche': n['precio_noche'],
                'subtotal_noche': n['subtotal_noche'],
            }
            for n in quote['detalle_noches']
        ],
    }
