import calendar
import uuid
from datetime import datetime, date
from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app import db
from app.infrastructure.models.admin_hotel_model import AdminHotelModel
from app.infrastructure.models.hotel_model import HotelModel
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.estado_model import EstadoModel
from app.infrastructure.models.pago_model import PagoModel
from app.infrastructure.models.reserva_detalle_tarifa_model import ReservaDetalleTarifaModel
from app.infrastructure.messaging import MessagePublisher, ReservationStateChangedEvent
from app.infrastructure.repositories.sqlalchemy_comentario_hotel_repository import SQLAlchemyComentarioHotelRepository
from app.application.use_cases.admin_review_use_cases import ListAdminReviewsUseCase
from app.application.use_cases import SendPushNotificationUseCase
from app.infrastructure.repositories import SQLAlchemyDeviceTokenRepository
from app.infrastructure.services import PushNotificationService


PAID_PAYMENT_STATUSES = {'completado', 'pagado', 'paid'}
REFUND_PAYMENT_STATUSES = {'reembolsado', 'refund', 'refunded', 'devuelto'}
REVIEWABLE_ADMIN_STATES = {'pendiente', 'pago recibido'}


def _require_admin(current_usuario):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403
    return None


def _normalize_name(value):
    return (value or '').strip().lower()


def _is_paid_payment_status(status):
    return _normalize_name(status) in PAID_PAYMENT_STATUSES


def _is_refund_payment_status(status):
    return _normalize_name(status) in REFUND_PAYMENT_STATUSES


def _calculate_payment_net(pagos):
    return round(
        sum(
            (p.total or 0.0)
            for p in pagos
            if _is_paid_payment_status(p.estado) or _is_refund_payment_status(p.estado)
        ),
        2,
    )


def _has_effective_payment(pagos):
    return _calculate_payment_net(pagos) > 0


def get_push_notification_use_case():
    device_token_repository = SQLAlchemyDeviceTokenRepository()
    push_service = PushNotificationService()
    return SendPushNotificationUseCase(device_token_repository, push_service)


def _create_virtual_refund_if_needed(reserva, pagos):
    net_paid = _calculate_payment_net(pagos)
    if net_paid <= 0:
        return None

    refund = PagoModel(
        id=str(uuid.uuid4()),
        fecha_pago=datetime.utcnow(),
        total=-net_paid,
        estado='reembolsado',
        id_pais=reserva.id_pais,
        id_reserva=reserva.id,
    )
    db.session.add(refund)
    return refund


def _serialize_admin_reserva_detail(reserva, habitacion, hotel, estado, pagos, detalle_tarifa):
    subtotal_noches = sum((d.subtotal_noche or 0.0) for d in detalle_tarifa)
    impuestos_estimados = max((reserva.total or 0.0) - subtotal_noches, 0.0)
    total_pagado = max(_calculate_payment_net(pagos), 0.0)

    timeline = [{
        'type': 'created',
        'title': 'Reservation Created',
        'at': reserva.created_at.isoformat() if reserva.created_at else None,
        'description': 'Booking initiated by guest',
    }]

    for pago in pagos:
        timeline.append({
            'type': 'payment',
            'title': 'Refund Registered' if _is_refund_payment_status(pago.estado) or (pago.total or 0.0) < 0 else 'Payment Registered',
            'at': pago.fecha_pago.isoformat() if pago.fecha_pago else None,
            'description': f"Payment status: {pago.estado}",
            'amount': pago.total,
            'status': pago.estado,
        })

    if reserva.updated_at and reserva.updated_at != reserva.created_at:
        timeline.append({
            'type': 'status_change',
            'title': 'Reservation Status Updated',
            'at': reserva.updated_at.isoformat(),
            'description': f"Current status: {estado.nombre}",
            'updated_by_user_id': reserva.updated_by_user_id,
            'version': reserva.version,
        })

    return {
        'id': reserva.id,
        'id_corto': reserva.id[:8].upper(),
        'fecha_ingreso': reserva.fecha_ingreso.isoformat() if reserva.fecha_ingreso else None,
        'fecha_salida': reserva.fecha_salida.isoformat() if reserva.fecha_salida else None,
        'nro_noches': (
            (reserva.fecha_salida.date() - reserva.fecha_ingreso.date()).days
            if reserva.fecha_salida and reserva.fecha_ingreso else None
        ),
        'nro_personas': reserva.nro_personas,
        'total': reserva.total,
        'id_usuario': reserva.id_usuario,
        'created_at': reserva.created_at.isoformat() if reserva.created_at else None,
        'updated_at': reserva.updated_at.isoformat() if reserva.updated_at else None,
        'updated_by_user_id': reserva.updated_by_user_id,
        'version': reserva.version,
        'habitacion': {
            'id': habitacion.id,
            'tipo': habitacion.tipo,
            'nro_habitacion': habitacion.nro_habitacion,
            'capacidad': habitacion.capacidad,
            'camas': habitacion.camas,
        },
        'hotel': {
            'id': hotel.id,
            'nombre': hotel.nombre,
        },
        'estado': {
            'id': estado.id,
            'nombre': estado.nombre,
        },
        'payments': [
            {
                'id': p.id,
                'fecha_pago': p.fecha_pago.isoformat() if p.fecha_pago else None,
                'total': p.total,
                'estado': p.estado,
            }
            for p in pagos
        ],
        'price_breakdown': {
            'subtotal_noches': subtotal_noches,
            'impuestos_estimados': impuestos_estimados,
            'total_pagado': total_pagado,
            'balance_pendiente': 0.0 if _normalize_name(estado.nombre) == 'rechazada' else max((reserva.total or 0.0) - total_pagado, 0.0),
            'detalle_noches': [
                {
                    'fecha_noche': d.fecha_noche.isoformat() if d.fecha_noche else None,
                    'precio_noche': d.precio_noche,
                    'subtotal_noche': d.subtotal_noche,
                }
                for d in detalle_tarifa
            ],
        },
        'timeline': sorted(
            timeline,
            key=lambda item: item.get('at') or '',
            reverse=False,
        ),
    }


def _parse_revenue_period():
    today = date.today()

    try:
        month = int(request.args.get('month', today.month))
    except (TypeError, ValueError):
        month = today.month

    try:
        year = int(request.args.get('year', today.year))
    except (TypeError, ValueError):
        year = today.year

    if month < 1 or month > 12:
        month = today.month
    if year < 2000 or year > 2100:
        year = today.year

    return year, month


def _build_daily_rows(year, month):
    total_days = calendar.monthrange(year, month)[1]
    rows = []
    for day in range(1, total_days + 1):
        iso_date = date(year, month, day).isoformat()
        rows.append({
            'date': iso_date,
            'bookings_count': 0,
            'gross_revenue': 0.0,
            'travelhub_commission': 0.0,
            'net_revenue': 0.0,
        })
    return rows


def _build_range_daily_rows(start: date, end: date) -> list:
    """Build a zero-filled list of daily rows for a date range [start, end] inclusive."""
    rows = []
    current = start
    while current <= end:
        rows.append({
            'date': current.isoformat(),
            'bookings_count': 0,
            'gross_revenue': 0.0,
            'travelhub_commission': 0.0,
            'net_revenue': 0.0,
        })
        current = date(current.year, current.month, current.day + 1) if current.day < calendar.monthrange(current.year, current.month)[1] else (
            date(current.year, current.month + 1, 1) if current.month < 12 else date(current.year + 1, 1, 1)
        )
    return rows


@api_v1_bp.route('/admin/revenue-report', methods=['GET'])
@require_token
def get_admin_revenue_report(current_usuario=None):
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']
    hotel_id = request.args.get('hotel_id', '').strip() or None

    # ── Parse optional date-range params (take priority over month/year) ─────
    def _parse_date_param(name):
        val = request.args.get(name, '').strip()
        if not val:
            return None
        try:
            return date.fromisoformat(val)
        except ValueError:
            return None

    fecha_desde = _parse_date_param('fecha_desde')
    fecha_hasta = _parse_date_param('fecha_hasta')

    # Fall back to month/year when no explicit range is given
    if fecha_desde and fecha_hasta:
        use_range = True
        range_start = fecha_desde
        range_end = fecha_hasta
    else:
        use_range = False
        year, month = _parse_revenue_period()

    hotel_rows = (
        db.session.query(AdminHotelModel, HotelModel)
        .join(HotelModel, AdminHotelModel.id_hotel == HotelModel.id)
        .filter(AdminHotelModel.id_usuario == id_usuario)
        .all()
    )

    authorized_hotels = [
        {'id': hotel.id, 'nombre': hotel.nombre}
        for _, hotel in hotel_rows
    ]
    hotel_ids = [hotel['id'] for hotel in authorized_hotels]

    commission_percentage = float(
        current_app.config.get('TRAVELHUB_COMMISSION_PERCENTAGE', 12.0)
    )

    if not hotel_ids:
        empty_rows = _build_range_daily_rows(range_start, range_end) if use_range else _build_daily_rows(year, month)
        return jsonify({
            'commission_percentage': commission_percentage,
            'authorized_hotels': [],
            'daily_rows': empty_rows,
            'summary': {'total_bookings': 0, 'gross_revenue': 0.0, 'travelhub_commission': 0.0, 'net_revenue': 0.0},
        }), 200

    if hotel_id and hotel_id not in hotel_ids:
        return jsonify({'error': 'Hotel not authorized for current admin'}), 403

    scoped_hotel_ids = [hotel_id] if hotel_id else hotel_ids
    included_statuses = ['pendiente', 'confirmada', 'completada']

    # ── Build date filter ─────────────────────────────────────────────────────
    if use_range:
        range_start_dt = datetime(range_start.year, range_start.month, range_start.day)
        range_end_dt = datetime(range_end.year, range_end.month, range_end.day, 23, 59, 59)
        date_filter_start = range_start_dt
        date_filter_end = range_end_dt
    else:
        date_filter_start = datetime(year, month, 1)
        date_filter_end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

    # Only count reservations that have a confirmed payment (money actually received)
    # and are NOT cancelled (cancelled = refunded, should not appear in revenue)
    paid_statuses = [s.lower() for s in PAID_PAYMENT_STATUSES]
    refund_statuses = [s.lower() for s in REFUND_PAYMENT_STATUSES]
    excluded_reservation_statuses = ['cancelada', 'cancelado', 'cancelled', 'rechazada', 'rechazado', 'rejected', 'pendiente', 'pending', 'en proceso', 'en_proceso', 'in process']

    rows = (
        db.session.query(
            db.func.date(ReservaModel.created_at).label('report_date'),
            db.func.count(ReservaModel.id).label('bookings_count'),
            db.func.coalesce(db.func.sum(PagoModel.total), 0.0).label('gross_revenue'),
        )
        .join(HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id)
        .join(EstadoModel, ReservaModel.id_estado == EstadoModel.id)
        .join(PagoModel, PagoModel.id_reserva == ReservaModel.id)
        .filter(HabitacionModel.id_hotel.in_(scoped_hotel_ids))
        .filter(ReservaModel.created_at.isnot(None))
        .filter(ReservaModel.created_at >= date_filter_start)
        .filter(ReservaModel.created_at <= date_filter_end)
        .filter(db.func.lower(PagoModel.estado).in_(paid_statuses))
        .filter(~db.func.lower(PagoModel.estado).in_(refund_statuses))
        .filter(~db.func.lower(EstadoModel.nombre).in_(excluded_reservation_statuses))
        .group_by(db.func.date(ReservaModel.created_at))
        .order_by(db.func.date(ReservaModel.created_at))
        .all()
    )

    daily_rows = _build_range_daily_rows(range_start, range_end) if use_range else _build_daily_rows(year, month)
    daily_rows_by_date = {row['date']: row for row in daily_rows}

    for row in rows:
        report_date = row.report_date.isoformat() if hasattr(row.report_date, 'isoformat') else str(row.report_date)
        gross_revenue = float(row.gross_revenue or 0.0)
        commission_amount = round(gross_revenue * (commission_percentage / 100.0), 2)
        net_revenue = round(gross_revenue - commission_amount, 2)
        if report_date in daily_rows_by_date:
            daily_rows_by_date[report_date]['bookings_count'] = int(row.bookings_count or 0)
            daily_rows_by_date[report_date]['gross_revenue'] = round(gross_revenue, 2)
            daily_rows_by_date[report_date]['travelhub_commission'] = commission_amount
            daily_rows_by_date[report_date]['net_revenue'] = net_revenue

    total_bookings = sum(row['bookings_count'] for row in daily_rows)
    total_gross = round(sum(row['gross_revenue'] for row in daily_rows), 2)
    total_commission = round(sum(row['travelhub_commission'] for row in daily_rows), 2)
    total_net = round(sum(row['net_revenue'] for row in daily_rows), 2)

    selected_hotel = next((hotel for hotel in authorized_hotels if hotel['id'] == hotel_id), None)

    period_label = (
        f"{range_start.isoformat()} – {range_end.isoformat()}"
        if use_range
        else date(year, month, 1).strftime('%B %Y')
    )

    return jsonify({
        'period': {
            'year': range_start.year if use_range else year,
            'month': range_start.month if use_range else month,
            'month_label': period_label,
        },
        'scope': {
            'hotel_id': hotel_id,
            'hotel_name': selected_hotel['nombre'] if selected_hotel else None,
            'is_consolidated': hotel_id is None,
            'included_statuses': included_statuses,
        },
        'commission_percentage': commission_percentage,
        'authorized_hotels': authorized_hotels,
        'daily_rows': daily_rows,
        'summary': {
            'total_bookings': total_bookings,
            'gross_revenue': total_gross,
            'travelhub_commission': total_commission,
            'net_revenue': total_net,
        },
    }), 200


@api_v1_bp.route('/admin/mis-hoteles', methods=['GET'])
@require_token
def get_mis_hoteles(current_usuario=None):
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']
    rows = (
        db.session.query(AdminHotelModel, HotelModel)
        .join(HotelModel, AdminHotelModel.id_hotel == HotelModel.id)
        .filter(AdminHotelModel.id_usuario == id_usuario)
        .all()
    )

    return jsonify([{
        'id': hotel.id,
        'nombre': hotel.nombre,
        'email': hotel.email,
        'descripcion': hotel.descripcion,
        'amenidades': hotel.amenidades,
        'id_ciudad': hotel.id_ciudad,
        'asignacion_id': asignacion.id,
        'asignado_en': asignacion.created_at.isoformat() if asignacion.created_at else None,
    } for asignacion, hotel in rows])


@api_v1_bp.route('/admin/hoteles/<hotel_id>/asignar', methods=['POST'])
@require_token
def asignar_hotel(hotel_id, current_usuario=None):
    err = _require_admin(current_usuario)
    if err:
        return err

    hotel = HotelModel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    id_usuario = current_usuario['id']

    existing = AdminHotelModel.query.filter_by(
        id_usuario=id_usuario, id_hotel=hotel_id
    ).first()
    if existing:
        return jsonify({'error': 'Admin already assigned to this hotel'}), 409

    asignacion = AdminHotelModel(
        id=str(uuid.uuid4()),
        id_usuario=id_usuario,
        id_hotel=hotel_id,
        created_at=datetime.utcnow(),
    )
    db.session.add(asignacion)
    db.session.commit()

    return jsonify(asignacion.to_dict()), 201


@api_v1_bp.route('/admin/hoteles/<hotel_id>/desasignar', methods=['DELETE'])
@require_token
def desasignar_hotel(hotel_id, current_usuario=None):
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']
    asignacion = AdminHotelModel.query.filter_by(
        id_usuario=id_usuario, id_hotel=hotel_id
    ).first()

    if not asignacion:
        return jsonify({'error': 'Assignment not found'}), 404

    db.session.delete(asignacion)
    db.session.commit()
    return jsonify({'message': 'Hotel unassigned successfully'}), 200


@api_v1_bp.route('/admin/reservas/dashboard', methods=['GET'])
@require_token
def get_dashboard_reservas(current_usuario=None):
    """
    HU-P-22 – Dashboard de Reservas.
    Returns aggregated stats and a paginated list of reservations scoped to
    the hotels managed by the authenticated admin.

    Query params:
        fecha_desde  (YYYY-MM-DD) – check-in date lower bound (inclusive)
        fecha_hasta  (YYYY-MM-DD) – check-in date upper bound (inclusive)
        id_estado    (string)     – filter by estado id
        tipo_habitacion (string)  – filter by room type (contains, case-insensitive)
        codigo       (string)     – filter by reservation id prefix (case-insensitive)
        page         (int, ≥1)   – page number (default 1)
        per_page     (int, 1-100) – page size (default 25)
    """
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']

    # ── Resolve hotels managed by this admin ─────────────────────────────────
    hotel_ids = [
        row.id_hotel
        for row in AdminHotelModel.query.filter_by(id_usuario=id_usuario).all()
    ]
    if not hotel_ids:
        return jsonify({
            'stats': {'total': 0, 'confirmadas': 0, 'pendientes': 0,
                      'canceladas': 0, 'rechazadas': 0, 'completadas': 0},
            'reservations': [],
            'total': 0,
            'page': 1,
            'per_page': 25,
            'pages': 0,
        }), 200

    # ── Parse & validate query parameters ────────────────────────────────────
    def parse_date(param_name):
        val = request.args.get(param_name)
        if not val:
            return None
        try:
            return date.fromisoformat(val)
        except ValueError:
            return None

    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 25))))
    except ValueError:
        page, per_page = 1, 25

    fecha_desde = parse_date('fecha_desde')
    fecha_hasta = parse_date('fecha_hasta')
    id_estado_filter = request.args.get('id_estado', '').strip() or None
    tipo_habitacion_filter = request.args.get('tipo_habitacion', '').strip() or None
    codigo_filter = request.args.get('codigo', '').strip() or None

    # ── Build base query (JOIN habitaciones → hotels, estados) ───────────────
    base_q = (
        db.session.query(ReservaModel, HabitacionModel, HotelModel, EstadoModel)
        .join(HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id)
        .join(HotelModel, HabitacionModel.id_hotel == HotelModel.id)
        .join(EstadoModel, ReservaModel.id_estado == EstadoModel.id)
        .filter(HabitacionModel.id_hotel.in_(hotel_ids))
    )

    # ── Apply filters ─────────────────────────────────────────────────────────
    if fecha_desde:
        base_q = base_q.filter(db.func.date(ReservaModel.fecha_ingreso) >= fecha_desde)
    if fecha_hasta:
        base_q = base_q.filter(db.func.date(ReservaModel.fecha_ingreso) <= fecha_hasta)
    if id_estado_filter:
        base_q = base_q.filter(ReservaModel.id_estado == id_estado_filter)
    if tipo_habitacion_filter:
        base_q = base_q.filter(
            HabitacionModel.tipo.ilike(f'%{tipo_habitacion_filter}%')
        )
    if codigo_filter:
        base_q = base_q.filter(
            ReservaModel.id.ilike(f'{codigo_filter}%')
        )

    # ── Aggregate stats from the same filtered dataset shown in dashboard
    # Use a subquery to guarantee the same WHERE/JOIN conditions are preserved.
    filtered_subq = base_q.with_entities(
        ReservaModel.id.label('id'),
        EstadoModel.nombre.label('nombre'),
    ).subquery()

    stats_q = (
        db.session.query(
            filtered_subq.c.nombre,
            db.func.count(filtered_subq.c.id).label('count'),
        )
        .group_by(filtered_subq.c.nombre)
        .all()
    )

    counts_by_estado = {row.nombre.lower(): row.count for row in stats_q}
    total_all = sum(counts_by_estado.values())

    stats = {
        'total': total_all,
        'confirmadas': counts_by_estado.get('confirmada', 0),
        'pendientes': counts_by_estado.get('pendiente', 0),
        'canceladas': counts_by_estado.get('cancelada', 0),
        'rechazadas': counts_by_estado.get('rechazada', 0),
        'completadas': counts_by_estado.get('completada', 0),
    }

    # ── Paginate filtered results ─────────────────────────────────────────────
    total_filtered = base_q.count()
    pages = max(1, -(-total_filtered // per_page))  # ceiling division
    page = min(page, pages)

    rows = (
        base_q
        .order_by(ReservaModel.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    reservations = []
    for reserva, habitacion, hotel, estado in rows:
        reservations.append({
            'id': reserva.id,
            'id_corto': reserva.id[:8].upper(),
            'fecha_ingreso': reserva.fecha_ingreso.isoformat() if reserva.fecha_ingreso else None,
            'fecha_salida': reserva.fecha_salida.isoformat() if reserva.fecha_salida else None,
            'nro_noches': (
                (reserva.fecha_salida.date() - reserva.fecha_ingreso.date()).days
                if reserva.fecha_salida and reserva.fecha_ingreso else None
            ),
            'nro_personas': reserva.nro_personas,
            'total': reserva.total,
            'id_usuario': reserva.id_usuario,
            'habitacion': {
                'id': habitacion.id,
                'tipo': habitacion.tipo,
                'nro_habitacion': habitacion.nro_habitacion,
            },
            'hotel': {
                'id': hotel.id,
                'nombre': hotel.nombre,
            },
            'estado': {
                'id': estado.id,
                'nombre': estado.nombre,
            },
            'created_at': reserva.created_at.isoformat() if reserva.created_at else None,
        })

    return jsonify({
        'stats': stats,
        'reservations': reservations,
        'total': total_filtered,
        'page': page,
        'per_page': per_page,
        'pages': pages,
    }), 200


@api_v1_bp.route('/admin/reservas/<reserva_id>/estado', methods=['PUT'])
@require_token
def update_reserva_estado_admin(reserva_id, current_usuario=None):
    """
    HU-P-23 hook: Allow admin to confirm or reject a reservation that belongs
    to one of their managed hotels.
    """
    err = _require_admin(current_usuario)
    if err:
        return err

    data = request.get_json()
    if not data or 'id_estado' not in data or 'version' not in data:
        return jsonify({'error': 'id_estado and version are required'}), 400

    id_usuario = current_usuario['id']
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    reason = (data.get('reason') or '').strip()

    # Verify the reservation belongs to a hotel managed by this admin
    reserva = (
        db.session.query(ReservaModel)
        .join(HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id)
        .join(AdminHotelModel, HabitacionModel.id_hotel == AdminHotelModel.id_hotel)
        .filter(
            ReservaModel.id == reserva_id,
            AdminHotelModel.id_usuario == id_usuario,
        )
        .first()
    )

    if not reserva:
        return jsonify({'error': 'Reservation not found or not authorized'}), 404

    estado_actual = EstadoModel.query.get(reserva.id_estado)
    if not estado_actual:
        return jsonify({'error': 'Current estado not found'}), 409

    if reserva.version != data['version']:
        return jsonify({
            'error': 'Reservation state is stale. Please refresh before retrying.',
            'code': 'STALE_VERSION',
            'current_version': reserva.version,
            'current_estado': estado_actual.nombre,
        }), 409

    nuevo_estado = EstadoModel.query.get(data['id_estado'])
    if not nuevo_estado:
        return jsonify({'error': 'Estado not found'}), 404

    pagos = (
        PagoModel.query
        .filter(PagoModel.id_reserva == reserva.id)
        .order_by(PagoModel.fecha_pago.desc())
        .all()
    )

    estado_actual_nombre = _normalize_name(estado_actual.nombre)
    nuevo_estado_nombre = _normalize_name(nuevo_estado.nombre)
    has_effective_payment = _has_effective_payment(pagos)

    if estado_actual_nombre not in REVIEWABLE_ADMIN_STATES:
        return jsonify({
            'error': 'Only reservations pending admin review can be confirmed or rejected',
            'code': 'INVALID_SOURCE_STATE',
            'current_estado': estado_actual.nombre,
        }), 409

    if nuevo_estado_nombre not in ['confirmada', 'rechazada']:
        return jsonify({
            'error': 'Target estado must be Confirmada or Rechazada',
            'code': 'INVALID_TARGET_STATE',
        }), 400

    if nuevo_estado_nombre == 'confirmada' and not has_effective_payment:
        return jsonify({
            'error': 'Reservation must have a completed payment before confirmation',
            'code': 'PAYMENT_REQUIRED',
        }), 409

    if nuevo_estado_nombre == 'rechazada' and not reason:
        return jsonify({
            'error': 'reason is required for Rechazada transition',
            'code': 'REASON_REQUIRED',
        }), 400

    previous_estado = estado_actual
    reserva.id_estado = nuevo_estado.id
    reserva.updated_by_user_id = id_usuario
    reserva.updated_at = datetime.utcnow()
    reserva.version = (reserva.version or 0) + 1

    refund = None
    if nuevo_estado_nombre == 'rechazada':
        refund = _create_virtual_refund_if_needed(reserva, pagos)

    db.session.commit()

    if nuevo_estado_nombre == 'confirmada':
        current_app.logger.info(f"[RESERVAS] Reservation {reserva_id} updated to confirmed estado by admin, sending push notification")
        try:
            push_use_case = get_push_notification_use_case()
            push_result = push_use_case.execute(
                user_id=reserva.id_usuario,
                title='Reserva Confirmada',
                body='Tu reserva ha sido confirmada exitosamente',
                data={'type': 'reservation_confirmed', 'reservation_id': reserva.id}
            )
            if push_result.get('success'):
                current_app.logger.info(f"[RESERVAS] Push notification sent successfully for reservation {reserva_id}")
            else:
                current_app.logger.warning(f"[RESERVAS] Failed to send push notification for reservation {reserva_id}: {push_result.get('error')}")
        except Exception as e:
            current_app.logger.error(f"[RESERVAS] Error sending push notification for reservation {reserva_id}: {str(e)}")

    current_app.logger.info(
        '[RESERVAS_AUDIT] estado_changed '
        f'reserva_id={reserva.id} '
        f'admin_id={id_usuario} '
        f'ip={client_ip} '
        f'from={previous_estado.nombre} '
        f'to={nuevo_estado.nombre} '
        f'reason={reason or "n/a"} '
        f'refund_total={refund.total if refund else 0} '
        f'version={reserva.version}'
    )

    try:
        event = ReservationStateChangedEvent.create(
            reservation_id=reserva.id,
            previous_state_id=previous_estado.id,
            previous_state_name=previous_estado.nombre,
            new_state_id=nuevo_estado.id,
            new_state_name=nuevo_estado.nombre,
            changed_by_user_id=id_usuario,
            reason=reason,
            version=reserva.version,
        )
        publisher = MessagePublisher.from_config()
        publisher.publish_reservation_state_changed(event.to_dict())
    except Exception as exc:
        current_app.logger.error(
            f"[RESERVAS_AUDIT] failed_to_publish_reservation_state_changed reserva_id={reserva.id} error={str(exc)}"
        )

    return jsonify({
        'id': reserva.id,
        'id_estado': reserva.id_estado,
        'estado_nombre': nuevo_estado.nombre,
        'version': reserva.version,
    }), 200


@api_v1_bp.route('/admin/reservas/<reserva_id>', methods=['GET'])
@require_token
def get_admin_reserva_detail(reserva_id, current_usuario=None):
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']

    row = (
        db.session.query(ReservaModel, HabitacionModel, HotelModel, EstadoModel)
        .join(HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id)
        .join(HotelModel, HabitacionModel.id_hotel == HotelModel.id)
        .join(EstadoModel, ReservaModel.id_estado == EstadoModel.id)
        .join(AdminHotelModel, HotelModel.id == AdminHotelModel.id_hotel)
        .filter(
            ReservaModel.id == reserva_id,
            AdminHotelModel.id_usuario == id_usuario,
        )
        .first()
    )

    if not row:
        return jsonify({'error': 'Reservation not found or not authorized'}), 404

    reserva, habitacion, hotel, estado = row

    pagos = (
        PagoModel.query
        .filter(PagoModel.id_reserva == reserva.id)
        .order_by(PagoModel.fecha_pago.desc())
        .all()
    )
    detalle_tarifa = (
        ReservaDetalleTarifaModel.query
        .filter(ReservaDetalleTarifaModel.id_reserva == reserva.id)
        .order_by(ReservaDetalleTarifaModel.fecha_noche.asc())
        .all()
    )

    return jsonify(_serialize_admin_reserva_detail(
        reserva,
        habitacion,
        hotel,
        estado,
        pagos,
        detalle_tarifa,
    )), 200


@api_v1_bp.route('/admin/reviews', methods=['GET'])
@require_token
def get_admin_reviews(current_usuario=None):
    """
    Get admin reviews with filtering, sorting, and pagination.
    
    Query Parameters:
    - hotel_id: Optional specific hotel ID (must be authorized)
    - rating: Optional rating filter (1-5)
    - date_from: Optional date filter (ISO format)
    - date_to: Optional date filter (ISO format)
    - sentiment: Optional sentiment filter (positive, neutral, negative)
    - search: Optional free-text search in comments
    - page: Page number (default 1)
    - per_page: Items per page (default 10, max 100)
    - sort_by: Sort key (created_at_desc, created_at_asc, rating_desc, rating_asc)
    
    Returns:
    {
        "reviews": [...],
        "total": int,
        "page": int,
        "per_page": int,
        "total_pages": int,
        "kpis": {...}
    }
    """
    err = _require_admin(current_usuario)
    if err:
        return err

    id_usuario = current_usuario['id']

    # Get authorized hotels
    authorized_hotels = (
        AdminHotelModel.query
        .filter(AdminHotelModel.id_usuario == id_usuario)
        .all()
    )

    if not authorized_hotels:
        return jsonify({'error': 'No authorized hotels'}), 403

    authorized_hotel_ids = [hotel.id_hotel for hotel in authorized_hotels]

    # Parse query parameters
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        rating_filter = None
        rating_param = request.args.get('rating')
        if rating_param:
            rating_filter = int(rating_param)
        
        date_from = None
        date_from_param = request.args.get('date_from')
        if date_from_param:
            date_from = datetime.fromisoformat(date_from_param)
        
        date_to = None
        date_to_param = request.args.get('date_to')
        if date_to_param:
            date_to = datetime.fromisoformat(date_to_param)
        
        sentiment_filter = request.args.get('sentiment')
        search_text = request.args.get('search')
        sort_by = request.args.get('sort_by', 'created_at_desc')
        
        hotel_id = request.args.get('hotel_id')
        if hotel_id:
            # Verify authorization for specific hotel
            if hotel_id not in authorized_hotel_ids:
                return jsonify({'error': 'Hotel not authorized for current admin'}), 403
            authorized_hotel_ids = [hotel_id]
        
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid query parameter: {str(e)}'}), 400

    # Use case execution
    try:
        repository = SQLAlchemyComentarioHotelRepository()
        use_case = ListAdminReviewsUseCase(repository)
        result = use_case.execute(
            authorized_hotel_ids=authorized_hotel_ids,
            rating_filter=rating_filter,
            date_from=date_from,
            date_to=date_to,
            sentiment_filter=sentiment_filter,
            search_text=search_text,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Error fetching admin reviews: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
