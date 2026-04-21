from flask import request, jsonify, current_app
from datetime import datetime
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateReservaUseCase, GetReservaUseCase, GetAllReservasUseCase,
    GetReservasByUsuarioUseCase, GetReservasByHabitacionUseCase,
    UpdateReservaUseCase, DeleteReservaUseCase,
    ValidateUserHoldUseCase, ReleaseRoomHoldUseCase, CheckRoomHoldUseCase,
    AcquireRoomHoldUseCase,
    PricingService, QuotationService, PricingRuleNotFoundError
)
from app.infrastructure.repositories import (
    SQLAlchemyReservaRepository,
    SQLAlchemyRoomHoldRepository,
    SQLAlchemyEstadoRepository,
    SQLAlchemyPricingRepository,
)
from app.infrastructure.services import PagosService, get_redis_lock_service, RedisLockAcquisitionError
from app.infrastructure.messaging import MessagePublisher, PaymentStatusUpdatedEvent
from app.domain.entities.estado import Estado


def get_repository():
    return SQLAlchemyReservaRepository()


def get_pagos_service():
    return PagosService(current_app.config['PAGOS_SERVICE_URL'])


def get_room_hold_repository():
    return SQLAlchemyRoomHoldRepository()


def get_lock_service():
    return get_redis_lock_service()


def get_pricing_services():
    pricing_repository = SQLAlchemyPricingRepository()
    pricing_service = PricingService(pricing_repository)
    quotation_service = QuotationService(pricing_repository, pricing_service)
    return pricing_repository, pricing_service, quotation_service


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/reservas', methods=['POST'])
@require_token
def create_reserva(current_usuario=None):
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
    id_cotizacion = data.get('id_cotizacion')
    payment_method = data.get('payment_method', 'card')

    if not all([fecha_ingreso, fecha_salida, nro_personas is not None,
                id_usuario, id_pais, id_habitacion, id_estado]):
        return jsonify({'error': 'All fields are required: fecha_ingreso, fecha_salida, nro_personas, id_usuario, id_pais, id_habitacion, id_estado'}), 400

    try:
        nro_personas = int(nro_personas)
    except (ValueError, TypeError):
        return jsonify({'error': 'nro_personas must be a positive integer'}), 400

    pricing_repository, pricing_service, quotation_service = get_pricing_services()
    pricing_breakdown = None
    moneda = 'USD'

    if id_cotizacion:
        quote = quotation_service.get_quotation(id_cotizacion)
        if not quote:
            return jsonify({'error': 'Cotizacion not found'}), 404
        if quotation_service.is_expired(quote):
            return jsonify({'error': 'Cotizacion expirada'}), 409
        if quote['id_usuario'] != id_usuario or quote['id_habitacion'] != id_habitacion:
            return jsonify({'error': 'Cotizacion does not match id_usuario/id_habitacion'}), 409
        if quote['fecha_ingreso'] != fecha_ingreso.date() or quote['fecha_salida'] != fecha_salida.date():
            return jsonify({'error': 'Cotizacion does not match fecha_ingreso/fecha_salida'}), 409
        total = quote['total']
        moneda = quote['moneda']
        pricing_breakdown = quote['detalle_noches']
    else:
        try:
            pricing = pricing_service.calculate_stay(
                id_habitacion=id_habitacion,
                fecha_ingreso=fecha_ingreso.date(),
                fecha_salida=fecha_salida.date(),
                nro_personas=nro_personas,
            )
            total = pricing['total']
            moneda = pricing['moneda']
            pricing_breakdown = pricing['detalle_noches']
        except PricingRuleNotFoundError as ex:
            return jsonify({'error': str(ex)}), 422
        except ValueError as ex:
            return jsonify({'error': str(ex)}), 400

    if moneda != 'USD':
        return jsonify({'error': 'Backend currency must be USD'}), 400

    lock_service = get_lock_service()
    
    if lock_service:
        fecha_ingreso_str = fecha_ingreso.strftime('%Y-%m-%d')
        fecha_salida_str = fecha_salida.strftime('%Y-%m-%d')
        
        try:
            with lock_service.room_hold_lock(id_habitacion, fecha_ingreso_str, fecha_salida_str):
                current_app.logger.info(
                    f"[RESERVAS] Redis lock acquired for reservation creation on room {id_habitacion}"
                )
                return _execute_reservation_creation(
                    fecha_ingreso, fecha_salida, total, nro_personas,
                    id_usuario, id_pais, id_habitacion, id_estado, payment_method,
                    id_cotizacion, pricing_breakdown, pricing_repository, moneda
                )
        except RedisLockAcquisitionError:
            current_app.logger.warning(
                f"[RESERVAS] Could not acquire Redis lock for room {id_habitacion} - concurrent request"
            )
            return jsonify({
                'error': 'Reservation operation is being processed by another request. Please retry.',
                'retry_after_ms': 500
            }), 429
    else:
        current_app.logger.warning(
            "[RESERVAS] Redis lock service unavailable, falling back to DB-only atomicity"
        )
        return _execute_reservation_creation(
            fecha_ingreso, fecha_salida, total, nro_personas,
            id_usuario, id_pais, id_habitacion, id_estado, payment_method,
            id_cotizacion, pricing_breakdown, pricing_repository, moneda
        )


def _execute_reservation_creation(
    fecha_ingreso, fecha_salida, total, nro_personas,
    id_usuario, id_pais, id_habitacion, id_estado, payment_method,
    id_cotizacion, pricing_breakdown, pricing_repository, moneda
):
    """Execute the actual reservation creation within the distributed lock."""
    room_hold_repository = get_room_hold_repository()
    validate_hold_use_case = ValidateUserHoldUseCase(room_hold_repository)
    has_valid_hold = validate_hold_use_case.execute(
        id_usuario, id_habitacion, fecha_ingreso, fecha_salida
    )

    repository = get_repository()
    confirmed_estados = ['confirmada', 'Confirmada', 'CONFIRMADA', 'Reservada via PMS']
    if repository.has_overlapping_confirmed_reservation(
        id_habitacion, fecha_ingreso, fecha_salida, confirmed_estados
    ):
        return jsonify({'error': 'Room is already reserved and confirmed for the requested dates'}), 409

    if not has_valid_hold:
        check_hold_use_case = CheckRoomHoldUseCase(room_hold_repository)
        existing_hold = check_hold_use_case.execute(id_habitacion, fecha_ingreso, fecha_salida)
        if existing_hold:
            return jsonify({
                'error': 'Room is held by another user. Please acquire a hold first.',
                'hold_expires_at': existing_hold.expires_at.isoformat()
            }), 409
        return jsonify({
            'error': 'You must acquire a hold on the room before making a reservation. POST to /habitaciones/{id}/hold first.'
        }), 400
        
    use_case = CreateReservaUseCase(repository)
    try:
        reserva = use_case.execute(
            fecha_ingreso, fecha_salida, total, nro_personas,
            id_usuario, id_pais, id_habitacion, id_estado, id_cotizacion
        )
        if not reserva:
            current_app.logger.error("[RESERVAS] Failed to save reservation to database")
            return jsonify({'error': 'Failed to save reservation to database'}), 500

        pricing_repository.save_reserva_tarifa_snapshot(reserva.id, pricing_breakdown or [])
    except Exception as e:
        current_app.logger.error(f"[RESERVAS] Error creating reservation: {str(e)}")
        return jsonify({'error': 'Failed to save reservation to database'}), 500

    current_app.logger.info(f"[RESERVAS] Reserva created: {reserva.id}, now registering payment...")

    user_hold = room_hold_repository.find_active_hold_by_user_and_room(
        id_usuario, id_habitacion, fecha_ingreso, fecha_salida
    )
    if user_hold:
        release_hold_use_case = ReleaseRoomHoldUseCase(room_hold_repository)
        release_hold_use_case.execute(user_hold.id)
        current_app.logger.info(f"[RESERVAS] Hold {user_hold.id} released after reservation creation")
    
    pagos_service = get_pagos_service()
    payment_result = pagos_service.create_payment(
        reservation_id=reserva.id,
        amount=total,
        currency=moneda,
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

    response_payload = _serialize_reserva(reserva)
    response_payload['moneda'] = moneda
    response_payload['detalle_tarifa'] = [
        {
            'fecha_noche': d['fecha_noche'].isoformat() if hasattr(d['fecha_noche'], 'isoformat') else str(d['fecha_noche']),
            'id_plan_tarifario': d['id_plan_tarifario'],
            'id_regla_tarifaria': d['id_regla_tarifaria'],
            'precio_noche': d['precio_noche'],
            'subtotal_noche': d['subtotal_noche'],
        }
        for d in (pricing_breakdown or [])
    ]
    response_payload['payment'] = payment_info
    return jsonify(response_payload), 201


@api_v1_bp.route('/reservas/<reserva_id>', methods=['GET'])
@require_token
def get_reserva(reserva_id, current_usuario=None):
    use_case = GetReservaUseCase(get_repository())
    reserva = use_case.execute(reserva_id)

    if not reserva:
        return jsonify({'error': 'Reserva not found'}), 404

    return jsonify(_serialize_reserva(reserva))


@api_v1_bp.route('/reservas', methods=['GET'])
@require_token
def get_all_reservas(current_usuario=None):
    use_case = GetAllReservasUseCase(get_repository())
    reservas = use_case.execute()

    return jsonify([_serialize_reserva(r) for r in reservas])


@api_v1_bp.route('/usuarios/<usuario_id>/reservas', methods=['GET'])
@require_token
def get_reservas_by_usuario(usuario_id, current_usuario=None):
    use_case = GetReservasByUsuarioUseCase(get_repository())
    reservas = use_case.execute(usuario_id)

    return jsonify([_serialize_reserva(r) for r in reservas])


@api_v1_bp.route('/usuarios/<usuario_id>/reservas/recently-viewed', methods=['GET'])
@require_token
def get_recently_viewed_by_usuario(usuario_id, current_usuario=None):
    try:
        limit = min(int(request.args.get('limit', 3)), 10)
    except (ValueError, TypeError):
        limit = 3

    repository = get_repository()
    result = repository.find_recently_viewed_enriched(usuario_id, limit)
    return jsonify(result)


@api_v1_bp.route('/habitaciones/<habitacion_id>/reservas', methods=['GET'])
@require_token
def get_reservas_by_habitacion(habitacion_id, current_usuario=None):
    use_case = GetReservasByHabitacionUseCase(get_repository())
    reservas = use_case.execute(habitacion_id)

    return jsonify([_serialize_reserva(r) for r in reservas])


@api_v1_bp.route('/reservas/<reserva_id>', methods=['PUT'])
@require_token
def update_reserva(reserva_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    repository = get_repository()
    existing_reserva = GetReservaUseCase(repository).execute(reserva_id)
    if not existing_reserva:
        return jsonify({'error': 'Reserva not found'}), 404

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

    total_edited = (
        'total' in update_data
        and update_data['total'] is not None
        and update_data['total'] != existing_reserva.total
    )

    use_case = UpdateReservaUseCase(repository)
    reserva = use_case.execute(reserva_id, **update_data)

    if not reserva:
        return jsonify({'error': 'Reserva not found'}), 404

    response_payload = _serialize_reserva(reserva)

    if total_edited:
        payment_method = data.get('payment_method', 'card')
        moneda = data.get('moneda', 'USD')
        current_app.logger.info(
            f"[RESERVAS] Total edited for reserva {reserva.id}, registering new payment..."
        )
        pagos_service = get_pagos_service()
        payment_result = pagos_service.create_payment(
            reservation_id=reserva.id,
            amount=reserva.total,
            currency=moneda,
            payment_method=payment_method,
            description=f"Payment for updated reservation {reserva.id}"
        )

        payment_info = None
        if 'error' not in payment_result:
            payment_info = {
                'payment_id': payment_result.get('id'),
                'payment_intent_id': payment_result.get('payment_intent_id'),
                'payment_status': payment_result.get('status')
            }
            current_app.logger.info(
                f"[RESERVAS] Payment registered with status: {payment_result.get('status')}"
            )
        else:
            current_app.logger.error(
                f"[RESERVAS] Failed to register payment: {payment_result.get('error')}"
            )

        response_payload['payment'] = payment_info
        response_payload['payment_id'] = payment_info['payment_id'] if payment_info else None

    return jsonify(response_payload)


@api_v1_bp.route('/reservas/<reserva_id>', methods=['DELETE'])
@require_token
def delete_reserva(reserva_id, current_usuario=None):
    use_case = DeleteReservaUseCase(get_repository())
    deleted = use_case.execute(reserva_id)

    if not deleted:
        return jsonify({'error': 'Reserva not found'}), 404

    return jsonify({'message': 'Reserva deleted successfully'})


@api_v1_bp.route('/reservas/webhook/pms', methods=['POST'])
def create_reserva_pms_webhook():
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

    if not all([fecha_ingreso, fecha_salida, total is not None, nro_personas is not None,
                id_usuario, id_pais, id_habitacion]):
        return jsonify({'error': 'All fields are required: fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion'}), 400

    repository = get_repository()
    room_hold_repository = get_room_hold_repository()
    estado_repository = SQLAlchemyEstadoRepository()

    estado_nombre = 'Reservada via PMS'
    estado = estado_repository.find_by_nombre(estado_nombre)
    if not estado:
        current_app.logger.info(f"[RESERVAS PMS] Estado '{estado_nombre}' not found, creating it")
        estado = Estado.create(nombre=estado_nombre, descripcion='Reserva creada desde el sistema PMS')
        estado = estado_repository.save(estado)
        current_app.logger.info(f"[RESERVAS PMS] Created estado '{estado_nombre}' with id {estado.id}")
    id_estado = estado.id

    confirmed_estados = ['confirmada', 'Confirmada', 'CONFIRMADA', 'Reservada via PMS']
    if repository.has_overlapping_confirmed_reservation(
        id_habitacion, fecha_ingreso, fecha_salida, confirmed_estados
    ):
        return jsonify({'error': 'Room is already reserved and confirmed for the requested dates'}), 409

    check_hold_use_case = CheckRoomHoldUseCase(room_hold_repository)
    existing_hold = check_hold_use_case.execute(id_habitacion, fecha_ingreso, fecha_salida)
    if existing_hold:
        release_hold_use_case = ReleaseRoomHoldUseCase(room_hold_repository)
        release_hold_use_case.execute(existing_hold.id)
        current_app.logger.info(f"[RESERVAS PMS] Released existing hold {existing_hold.id} for PMS reservation")

    acquire_hold_use_case = AcquireRoomHoldUseCase(room_hold_repository)
    pms_hold = acquire_hold_use_case.execute(
        id_habitacion=id_habitacion,
        id_usuario=id_usuario,
        fecha_ingreso=fecha_ingreso,
        fecha_salida=fecha_salida,
        hold_duration_minutes=5
    )
    current_app.logger.info(f"[RESERVAS PMS] Hold {pms_hold.id} acquired for PMS reservation")

    use_case = CreateReservaUseCase(repository)
    reserva = use_case.execute(
        fecha_ingreso, fecha_salida, total, nro_personas,
        id_usuario, id_pais, id_habitacion, id_estado
    )

    current_app.logger.info(f"[RESERVAS PMS] Reserva created via PMS webhook: {reserva.id} with estado '{estado_nombre}'")

    release_hold_use_case = ReleaseRoomHoldUseCase(room_hold_repository)
    release_hold_use_case.execute(pms_hold.id)
    current_app.logger.info(f"[RESERVAS PMS] Hold {pms_hold.id} released after reservation creation")

    return jsonify({
        **_serialize_reserva(reserva),
        'estado_nombre': estado_nombre,
        'source': 'PMS'
    }), 201


def _serialize_reserva(reserva):
    return {
        'id': reserva.id,
        'fecha_ingreso': reserva.fecha_ingreso.isoformat(),
        'fecha_salida': reserva.fecha_salida.isoformat(),
        'total': reserva.total,
        'nro_personas': reserva.nro_personas,
        'id_usuario': reserva.id_usuario,
        'id_pais': reserva.id_pais,
        'id_habitacion': reserva.id_habitacion,
        'id_estado': reserva.id_estado,
        'id_cotizacion': reserva.id_cotizacion,
    }


@api_v1_bp.route('/payments/webhook', methods=['POST'])
def payment_webhook():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    payment_intent_id = data.get('payment_intent_id')
    status = data.get('status')
    reservation_id = data.get('reservation_id')
    amount = data.get('amount')
    currency = data.get('currency', 'USD')
    
    if not payment_intent_id or not status:
        return jsonify({'error': 'payment_intent_id and status are required'}), 400
    
    current_app.logger.info(f"[RESERVAS] Payment webhook received: payment_intent_id={payment_intent_id}, status={status}")
    
    if status != 'completado':
        current_app.logger.info(f"[RESERVAS] Ignoring non-completed payment status: {status}")
        try:
            event = PaymentStatusUpdatedEvent.create(
                payment_intent_id=payment_intent_id,
                reservation_id=reservation_id or '',
                status=status,
                amount=amount or 0,
                currency=currency
            )
            publisher = MessagePublisher.from_config()
            publisher.publish_payment_status_updated(event.to_dict())
            current_app.logger.info(f"[RESERVAS] Published PaymentStatusUpdated event for non-completed status")
        except Exception as e:
            current_app.logger.error(f"[RESERVAS] Failed to publish PaymentStatusUpdated event: {str(e)}")
        return jsonify({'message': f'Payment status {status} received, no reservation update needed'}), 200
    
    if not reservation_id:
        current_app.logger.error(f"[RESERVAS] reservation_id is required for completed payments")
        return jsonify({'error': 'reservation_id is required for completed payments'}), 400
    
    estado_repo = SQLAlchemyEstadoRepository()
    reserva_repo = get_repository()
    
    estado_nombre = "Pago recibido"
    estado = estado_repo.find_by_nombre(estado_nombre)
    
    if not estado:
        current_app.logger.info(f"[RESERVAS] Estado '{estado_nombre}' not found, creating it")
        estado = Estado.create(nombre=estado_nombre, descripcion="El pago de la reserva ha sido recibido")
        estado = estado_repo.save(estado)
        current_app.logger.info(f"[RESERVAS] Created estado '{estado_nombre}' with id {estado.id}")
    
    reserva = reserva_repo.find_by_id(reservation_id)
    if not reserva:
        current_app.logger.error(f"[RESERVAS] Reservation {reservation_id} not found")
        return jsonify({'error': 'Reservation not found'}), 404
    
    reserva.id_estado = estado.id
    reserva_repo.update(reserva)
    current_app.logger.info(f"[RESERVAS] Updated reservation {reservation_id} to estado '{estado_nombre}'")
    
    try:
        event = PaymentStatusUpdatedEvent.create(
            payment_intent_id=payment_intent_id,
            reservation_id=reservation_id,
            status=status,
            amount=amount or reserva.total,
            currency=currency
        )
        publisher = MessagePublisher.from_config()
        publisher.publish_payment_status_updated(event.to_dict())
        current_app.logger.info(f"[RESERVAS] Published PaymentStatusUpdated event for reservation {reservation_id}")
    except Exception as e:
        current_app.logger.error(f"[RESERVAS] Failed to publish PaymentStatusUpdated event: {str(e)}")
    
    return jsonify({
        'reservation_id': reserva.id,
        'estado': estado_nombre,
        'payment_intent_id': payment_intent_id,
        'status': status
    }), 200
