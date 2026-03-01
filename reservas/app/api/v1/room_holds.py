from datetime import datetime
from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.config.constants import DEFAULT_HOLD_DURATION_MINUTES
from app.application.use_cases import (
    AcquireRoomHoldUseCase, GetRoomHoldUseCase, CheckRoomHoldUseCase,
    ReleaseRoomHoldUseCase, CleanupExpiredHoldsUseCase
)
from app.infrastructure.repositories import SQLAlchemyRoomHoldRepository


def get_repository():
    return SQLAlchemyRoomHoldRepository()


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/habitaciones/<habitacion_id>/hold', methods=['POST'])
def acquire_room_hold(habitacion_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    id_usuario = data.get('id_usuario')
    fecha_ingreso = parse_datetime(data.get('fecha_ingreso'))
    fecha_salida = parse_datetime(data.get('fecha_salida'))
    hold_duration_minutes = data.get('hold_duration_minutes', DEFAULT_HOLD_DURATION_MINUTES)

    if not all([id_usuario, fecha_ingreso, fecha_salida]):
        return jsonify({
            'error': 'Required fields: id_usuario, fecha_ingreso, fecha_salida'
        }), 400

    use_case = AcquireRoomHoldUseCase(get_repository())
    hold = use_case.execute(
        id_habitacion=habitacion_id,
        id_usuario=id_usuario,
        fecha_ingreso=fecha_ingreso,
        fecha_salida=fecha_salida,
        hold_duration_minutes=hold_duration_minutes
    )

    if not hold:
        current_app.logger.info(
            f"[RESERVAS] Hold request denied for room {habitacion_id} - already held"
        )
        return jsonify({
            'error': 'Room is already held by another user for the requested dates'
        }), 409

    current_app.logger.info(
        f"[RESERVAS] Hold acquired: {hold.id} for room {habitacion_id} by user {id_usuario}"
    )

    return jsonify({
        'id': hold.id,
        'id_habitacion': hold.id_habitacion,
        'id_usuario': hold.id_usuario,
        'fecha_ingreso': hold.fecha_ingreso.isoformat(),
        'fecha_salida': hold.fecha_salida.isoformat(),
        'created_at': hold.created_at.isoformat(),
        'expires_at': hold.expires_at.isoformat()
    }), 201


@api_v1_bp.route('/holds/<hold_id>', methods=['GET'])
def get_room_hold(hold_id):
    use_case = GetRoomHoldUseCase(get_repository())
    hold = use_case.execute(hold_id)

    if not hold:
        return jsonify({'error': 'Hold not found'}), 404

    return jsonify({
        'id': hold.id,
        'id_habitacion': hold.id_habitacion,
        'id_usuario': hold.id_usuario,
        'fecha_ingreso': hold.fecha_ingreso.isoformat(),
        'fecha_salida': hold.fecha_salida.isoformat(),
        'created_at': hold.created_at.isoformat(),
        'expires_at': hold.expires_at.isoformat(),
        'is_active': hold.is_active()
    })


@api_v1_bp.route('/habitaciones/<habitacion_id>/hold/check', methods=['POST'])
def check_room_hold(habitacion_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    fecha_ingreso = parse_datetime(data.get('fecha_ingreso'))
    fecha_salida = parse_datetime(data.get('fecha_salida'))

    if not all([fecha_ingreso, fecha_salida]):
        return jsonify({
            'error': 'Required fields: fecha_ingreso, fecha_salida'
        }), 400

    use_case = CheckRoomHoldUseCase(get_repository())
    hold = use_case.execute(habitacion_id, fecha_ingreso, fecha_salida)

    if hold:
        return jsonify({
            'is_held': True,
            'hold': {
                'id': hold.id,
                'id_usuario': hold.id_usuario,
                'expires_at': hold.expires_at.isoformat()
            }
        })

    return jsonify({'is_held': False})


@api_v1_bp.route('/holds/<hold_id>', methods=['DELETE'])
def release_room_hold(hold_id):
    use_case = ReleaseRoomHoldUseCase(get_repository())
    deleted = use_case.execute(hold_id)

    if not deleted:
        return jsonify({'error': 'Hold not found'}), 404

    current_app.logger.info(f"[RESERVAS] Hold released: {hold_id}")
    return jsonify({'message': 'Hold released successfully'})


@api_v1_bp.route('/holds/cleanup', methods=['POST'])
def cleanup_expired_holds():
    use_case = CleanupExpiredHoldsUseCase(get_repository())
    deleted_count = use_case.execute()

    current_app.logger.info(f"[RESERVAS] Cleaned up {deleted_count} expired holds")
    return jsonify({
        'message': f'Cleaned up {deleted_count} expired holds',
        'deleted_count': deleted_count
    })
