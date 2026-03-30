from flask import request, jsonify, current_app
from datetime import datetime
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreatePagoUseCase, GetPagoUseCase, GetAllPagosUseCase,
    GetPagosByReservaUseCase, UpdatePagoUseCase, DeletePagoUseCase
)
from app.infrastructure.repositories import SQLAlchemyPagoRepository
from app.infrastructure.services import PagosService


def get_repository():
    return SQLAlchemyPagoRepository()


def get_pagos_service():
    return PagosService(current_app.config['PAGOS_SERVICE_URL'])


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/pagos', methods=['POST'])
@require_token
def create_pago(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    fecha_pago = parse_datetime(data.get('fecha_pago'))
    total = data.get('total')
    estado = data.get('estado')
    id_pais = data.get('id_pais')
    id_reserva = data.get('id_reserva')
    payment_method = data.get('payment_method', 'card')
    currency = data.get('currency', 'USD')
    description = data.get('description')

    if not all([fecha_pago, total is not None, estado, id_pais, id_reserva]):
        return jsonify({'error': 'All fields are required: fecha_pago, total, estado, id_pais, id_reserva'}), 400

    pagos_service = get_pagos_service()
    external_result = pagos_service.create_payment(
        reservation_id=str(id_reserva),
        amount=float(total),
        currency=currency,
        payment_method=payment_method,
        description=description
    )

    if 'error' in external_result:
        return jsonify({
            'error': 'Failed to process payment with external service',
            'details': external_result['error']
        }), 502

    use_case = CreatePagoUseCase(get_repository())
    pago = use_case.execute(fecha_pago, total, estado, id_pais, id_reserva)

    return jsonify({
        'id': pago.id,
        'fecha_pago': pago.fecha_pago.isoformat(),
        'total': pago.total,
        'estado': pago.estado,
        'id_pais': pago.id_pais,
        'id_reserva': pago.id_reserva,
        'external_payment': external_result
    }), 201


@api_v1_bp.route('/pagos/<pago_id>', methods=['GET'])
@require_token
def get_pago(pago_id, current_usuario=None):
    use_case = GetPagoUseCase(get_repository())
    pago = use_case.execute(pago_id)

    if not pago:
        return jsonify({'error': 'Pago not found'}), 404

    return jsonify({
        'id': pago.id,
        'fecha_pago': pago.fecha_pago.isoformat(),
        'total': pago.total,
        'estado': pago.estado,
        'id_pais': pago.id_pais,
        'id_reserva': pago.id_reserva
    })


@api_v1_bp.route('/pagos', methods=['GET'])
@require_token
def get_all_pagos(current_usuario=None):
    use_case = GetAllPagosUseCase(get_repository())
    pagos = use_case.execute()

    return jsonify([{
        'id': p.id,
        'fecha_pago': p.fecha_pago.isoformat(),
        'total': p.total,
        'estado': p.estado,
        'id_pais': p.id_pais,
        'id_reserva': p.id_reserva
    } for p in pagos])


@api_v1_bp.route('/reservas/<reserva_id>/pagos', methods=['GET'])
@require_token
def get_pagos_by_reserva(reserva_id, current_usuario=None):
    use_case = GetPagosByReservaUseCase(get_repository())
    pagos = use_case.execute(reserva_id)

    return jsonify([{
        'id': p.id,
        'fecha_pago': p.fecha_pago.isoformat(),
        'total': p.total,
        'estado': p.estado,
        'id_pais': p.id_pais,
        'id_reserva': p.id_reserva
    } for p in pagos])


@api_v1_bp.route('/pagos/<pago_id>', methods=['PUT'])
@require_token
def update_pago(pago_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    update_data = {}
    if 'fecha_pago' in data:
        update_data['fecha_pago'] = parse_datetime(data['fecha_pago'])
    if 'total' in data:
        update_data['total'] = data['total']
    if 'estado' in data:
        update_data['estado'] = data['estado']
    if 'id_pais' in data:
        update_data['id_pais'] = data['id_pais']
    if 'id_reserva' in data:
        update_data['id_reserva'] = data['id_reserva']

    use_case = UpdatePagoUseCase(get_repository())
    pago = use_case.execute(pago_id, **update_data)

    if not pago:
        return jsonify({'error': 'Pago not found'}), 404

    return jsonify({
        'id': pago.id,
        'fecha_pago': pago.fecha_pago.isoformat(),
        'total': pago.total,
        'estado': pago.estado,
        'id_pais': pago.id_pais,
        'id_reserva': pago.id_reserva
    })


@api_v1_bp.route('/pagos/<pago_id>', methods=['DELETE'])
@require_token
def delete_pago(pago_id, current_usuario=None):
    use_case = DeletePagoUseCase(get_repository())
    deleted = use_case.execute(pago_id)

    if not deleted:
        return jsonify({'error': 'Pago not found'}), 404

    return jsonify({'message': 'Pago deleted successfully'})
