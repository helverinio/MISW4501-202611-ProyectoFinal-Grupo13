from datetime import datetime
from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.config.constants import DEFAULT_HOLD_DURATION_MINUTES
from app.application.use_cases import (
    AcquireRoomHoldUseCase, GetRoomHoldUseCase, CheckRoomHoldUseCase,
    ReleaseRoomHoldUseCase, CleanupExpiredHoldsUseCase
)
from app.infrastructure.repositories import SQLAlchemyRoomHoldRepository
from app.infrastructure.services import get_redis_lock_service, RedisLockAcquisitionError


def get_repository():
    return SQLAlchemyRoomHoldRepository()


def get_lock_service():
    return get_redis_lock_service()


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/habitaciones/<habitacion_id>/hold', methods=['POST'])
@require_token
def acquire_room_hold(habitacion_id, current_usuario=None):
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

    lock_service = get_lock_service()
    fecha_ingreso_str = fecha_ingreso.strftime('%Y-%m-%d')
    fecha_salida_str = fecha_salida.strftime('%Y-%m-%d')
    
    if lock_service:
        cached_exists, cached_hold = lock_service.check_room_hold_exists_in_cache(
            habitacion_id, fecha_ingreso_str, fecha_salida_str
        )
        
        if cached_exists and cached_hold:
            if cached_hold.get('id_usuario') != id_usuario:
                current_app.logger.info(
                    f"[RESERVAS] Cache hit: room {habitacion_id} already held by another user"
                )
                return jsonify({
                    'error': 'Room is already held by another user for the requested dates'
                }), 409
            else:
                current_app.logger.info(
                    f"[RESERVAS] Cache hit: returning existing hold for user {id_usuario}"
                )
                return jsonify(cached_hold), 200
        
        try:
            with lock_service.room_hold_lock(
                habitacion_id, fecha_ingreso_str, fecha_salida_str, blocking=False
            ):
                current_app.logger.info(
                    f"[RESERVAS] Redis lock acquired for room {habitacion_id} hold request"
                )
                return _execute_hold_acquisition(
                    habitacion_id, id_usuario, fecha_ingreso, fecha_salida, 
                    hold_duration_minutes, lock_service, fecha_ingreso_str, fecha_salida_str
                )
        except RedisLockAcquisitionError:
            current_app.logger.info(
                f"[RESERVAS] Fast-fail: room {habitacion_id} lock busy - rejecting immediately"
            )
            return jsonify({
                'error': 'Room is currently being processed. Please retry shortly.',
                'retry_after_ms': 100
            }), 429
    else:
        current_app.logger.warning(
            "[RESERVAS] Redis lock service unavailable, falling back to DB-only atomicity"
        )
        return _execute_hold_acquisition(
            habitacion_id, id_usuario, fecha_ingreso, fecha_salida, hold_duration_minutes
        )


def _execute_hold_acquisition(
    habitacion_id, id_usuario, fecha_ingreso, fecha_salida, hold_duration_minutes,
    lock_service=None, fecha_ingreso_str=None, fecha_salida_str=None
):
    """Execute the actual hold acquisition within the distributed lock."""
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

    hold_data = {
        'id': hold.id,
        'id_habitacion': hold.id_habitacion,
        'id_usuario': hold.id_usuario,
        'fecha_ingreso': hold.fecha_ingreso.isoformat(),
        'fecha_salida': hold.fecha_salida.isoformat(),
        'created_at': hold.created_at.isoformat(),
        'expires_at': hold.expires_at.isoformat()
    }

    if lock_service and fecha_ingreso_str and fecha_salida_str:
        ttl_seconds = int((hold.expires_at - datetime.utcnow()).total_seconds())
        if ttl_seconds > 0:
            lock_service.cache_room_hold(
                hold_data, habitacion_id, fecha_ingreso_str, fecha_salida_str, ttl_seconds
            )

    return jsonify(hold_data), 201


@api_v1_bp.route('/holds/<hold_id>', methods=['GET'])
@require_token
def get_room_hold(hold_id, current_usuario=None):
    lock_service = get_lock_service()
    
    if lock_service:
        cached_hold = lock_service.get_cached_room_hold_by_id(hold_id)
        if cached_hold:
            current_app.logger.debug(f"[RESERVAS] Cache hit for hold {hold_id}")
            cached_hold['is_active'] = True
            return jsonify(cached_hold)
    
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
@require_token
def check_room_hold(habitacion_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    fecha_ingreso = parse_datetime(data.get('fecha_ingreso'))
    fecha_salida = parse_datetime(data.get('fecha_salida'))

    if not all([fecha_ingreso, fecha_salida]):
        return jsonify({
            'error': 'Required fields: fecha_ingreso, fecha_salida'
        }), 400

    lock_service = get_lock_service()
    fecha_ingreso_str = fecha_ingreso.strftime('%Y-%m-%d')
    fecha_salida_str = fecha_salida.strftime('%Y-%m-%d')
    
    if lock_service:
        cached_exists, cached_hold = lock_service.check_room_hold_exists_in_cache(
            habitacion_id, fecha_ingreso_str, fecha_salida_str
        )
        if cached_exists and cached_hold:
            current_app.logger.debug(f"[RESERVAS] Cache hit for room {habitacion_id} check")
            return jsonify({
                'is_held': True,
                'hold': {
                    'id': cached_hold['id'],
                    'id_usuario': cached_hold['id_usuario'],
                    'expires_at': cached_hold['expires_at']
                }
            })

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
@require_token
def release_room_hold(hold_id, current_usuario=None):
    lock_service = get_lock_service()
    
    if lock_service:
        lock_service.invalidate_room_hold_cache_by_id(hold_id)
    
    use_case = ReleaseRoomHoldUseCase(get_repository())
    deleted = use_case.execute(hold_id)

    if not deleted:
        return jsonify({'error': 'Hold not found'}), 404

    current_app.logger.info(f"[RESERVAS] Hold released: {hold_id}")
    return jsonify({'message': 'Hold released successfully'})


@api_v1_bp.route('/holds/cleanup', methods=['POST'])
@require_token
def cleanup_expired_holds(current_usuario=None):
    use_case = CleanupExpiredHoldsUseCase(get_repository())
    deleted_count = use_case.execute()

    current_app.logger.info(f"[RESERVAS] Cleaned up {deleted_count} expired holds")
    return jsonify({
        'message': f'Cleaned up {deleted_count} expired holds',
        'deleted_count': deleted_count
    })
