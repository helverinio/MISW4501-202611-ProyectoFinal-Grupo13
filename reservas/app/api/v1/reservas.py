from flask import request, jsonify, current_app
from datetime import datetime
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreateReservaUseCase, GetReservaUseCase, GetAllReservasUseCase,
    GetReservasByUsuarioUseCase, GetReservasByHabitacionUseCase,
    UpdateReservaUseCase, DeleteReservaUseCase
)
from app.infrastructure.repositories import SQLAlchemyReservaRepository
from app.infrastructure.services import PagosService


def get_repository():
    return SQLAlchemyReservaRepository()


def get_pagos_service():
    return PagosService(current_app.config['PAGOS_SERVICE_URL'])


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/reservas', methods=['POST'])
def create_reserva():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    fecha_ingreso = parse_datetime(data.get('fecha_ingreso'))
    fecha_salida = parse_datetime(data.get('fecha_salida'))
    total = data.get('total')
    nro_personas = data.get('nro_personas')
    id_usuario = data.get('id_usuario')
    id_pais = data.get('id_pais')
    id_habitacion = data.get('id_habitacion')
    id_estado = data.get('id_estado')
    payment_method = data.get('payment_method', 'card')

    if not all([fecha_ingreso, fecha_salida, total is not None, nro_personas is not None,
                id_usuario, id_pais, id_habitacion, id_estado]):
        return jsonify({'error': 'All fields are required: fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion, id_estado'}), 400

    repository = get_repository()
    confirmed_estados = ['confirmada', 'Confirmada', 'CONFIRMADA']
    if repository.has_overlapping_confirmed_reservation(
        id_habitacion, fecha_ingreso, fecha_salida, confirmed_estados
    ):
        return jsonify({'error': 'Room is already reserved and confirmed for the requested dates'}), 409

    use_case = CreateReservaUseCase(repository)
    reserva = use_case.execute(
        fecha_ingreso, fecha_salida, total, nro_personas,
        id_usuario, id_pais, id_habitacion, id_estado
    )

    current_app.logger.info(f"[RESERVAS] Reserva created: {reserva.id}, now registering payment...")
    
    pagos_service = get_pagos_service()
    payment_result = pagos_service.create_payment(
        reservation_id=reserva.id,
        amount=total,
        currency='USD',
        payment_method=payment_method,
        description=f"Payment for reservation {reserva.id}"
    )
    
    payment_info = None
    if 'error' not in payment_result:
        payment_info = {
            'payment_id': payment_result.get('id'),
            'payment_intent_id': payment_result.get('payment_intent_id'),
            'payment_status': payment_result.get('status')
        }
        current_app.logger.info(f"[RESERVAS] Payment registered with status: {payment_result.get('status')}")
    else:
        current_app.logger.error(f"[RESERVAS] Failed to register payment: {payment_result.get('error')}")

    return jsonify({
        'id': reserva.id,
        'fecha_ingreso': reserva.fecha_ingreso.isoformat(),
        'fecha_salida': reserva.fecha_salida.isoformat(),
        'total': reserva.total,
        'nro_personas': reserva.nro_personas,
        'id_usuario': reserva.id_usuario,
        'id_pais': reserva.id_pais,
        'id_habitacion': reserva.id_habitacion,
        'id_estado': reserva.id_estado,
        'payment': payment_info
    }), 201


@api_v1_bp.route('/reservas/<reserva_id>', methods=['GET'])
def get_reserva(reserva_id):
    use_case = GetReservaUseCase(get_repository())
    reserva = use_case.execute(reserva_id)

    if not reserva:
        return jsonify({'error': 'Reserva not found'}), 404

    return jsonify({
        'id': reserva.id,
        'fecha_ingreso': reserva.fecha_ingreso.isoformat(),
        'fecha_salida': reserva.fecha_salida.isoformat(),
        'total': reserva.total,
        'nro_personas': reserva.nro_personas,
        'id_usuario': reserva.id_usuario,
        'id_pais': reserva.id_pais,
        'id_habitacion': reserva.id_habitacion,
        'id_estado': reserva.id_estado
    })


@api_v1_bp.route('/reservas', methods=['GET'])
def get_all_reservas():
    use_case = GetAllReservasUseCase(get_repository())
    reservas = use_case.execute()

    return jsonify([{
        'id': r.id,
        'fecha_ingreso': r.fecha_ingreso.isoformat(),
        'fecha_salida': r.fecha_salida.isoformat(),
        'total': r.total,
        'nro_personas': r.nro_personas,
        'id_usuario': r.id_usuario,
        'id_pais': r.id_pais,
        'id_habitacion': r.id_habitacion,
        'id_estado': r.id_estado
    } for r in reservas])


@api_v1_bp.route('/usuarios/<usuario_id>/reservas', methods=['GET'])
def get_reservas_by_usuario(usuario_id):
    use_case = GetReservasByUsuarioUseCase(get_repository())
    reservas = use_case.execute(usuario_id)

    return jsonify([{
        'id': r.id,
        'fecha_ingreso': r.fecha_ingreso.isoformat(),
        'fecha_salida': r.fecha_salida.isoformat(),
        'total': r.total,
        'nro_personas': r.nro_personas,
        'id_usuario': r.id_usuario,
        'id_pais': r.id_pais,
        'id_habitacion': r.id_habitacion,
        'id_estado': r.id_estado
    } for r in reservas])


@api_v1_bp.route('/habitaciones/<habitacion_id>/reservas', methods=['GET'])
def get_reservas_by_habitacion(habitacion_id):
    use_case = GetReservasByHabitacionUseCase(get_repository())
    reservas = use_case.execute(habitacion_id)

    return jsonify([{
        'id': r.id,
        'fecha_ingreso': r.fecha_ingreso.isoformat(),
        'fecha_salida': r.fecha_salida.isoformat(),
        'total': r.total,
        'nro_personas': r.nro_personas,
        'id_usuario': r.id_usuario,
        'id_pais': r.id_pais,
        'id_habitacion': r.id_habitacion,
        'id_estado': r.id_estado
    } for r in reservas])


@api_v1_bp.route('/reservas/<reserva_id>', methods=['PUT'])
def update_reserva(reserva_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    update_data = {}
    if 'fecha_ingreso' in data:
        update_data['fecha_ingreso'] = parse_datetime(data['fecha_ingreso'])
    if 'fecha_salida' in data:
        update_data['fecha_salida'] = parse_datetime(data['fecha_salida'])
    if 'total' in data:
        update_data['total'] = data['total']
    if 'nro_personas' in data:
        update_data['nro_personas'] = data['nro_personas']
    if 'id_usuario' in data:
        update_data['id_usuario'] = data['id_usuario']
    if 'id_pais' in data:
        update_data['id_pais'] = data['id_pais']
    if 'id_habitacion' in data:
        update_data['id_habitacion'] = data['id_habitacion']
    if 'id_estado' in data:
        update_data['id_estado'] = data['id_estado']

    use_case = UpdateReservaUseCase(get_repository())
    reserva = use_case.execute(reserva_id, **update_data)

    if not reserva:
        return jsonify({'error': 'Reserva not found'}), 404

    return jsonify({
        'id': reserva.id,
        'fecha_ingreso': reserva.fecha_ingreso.isoformat(),
        'fecha_salida': reserva.fecha_salida.isoformat(),
        'total': reserva.total,
        'nro_personas': reserva.nro_personas,
        'id_usuario': reserva.id_usuario,
        'id_pais': reserva.id_pais,
        'id_habitacion': reserva.id_habitacion,
        'id_estado': reserva.id_estado
    })


@api_v1_bp.route('/reservas/<reserva_id>', methods=['DELETE'])
def delete_reserva(reserva_id):
    use_case = DeleteReservaUseCase(get_repository())
    deleted = use_case.execute(reserva_id)

    if not deleted:
        return jsonify({'error': 'Reserva not found'}), 404

    return jsonify({'message': 'Reserva deleted successfully'})
