import uuid
from datetime import datetime, date
from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app import db
from app.infrastructure.models.admin_hotel_model import AdminHotelModel
from app.infrastructure.models.hotel_model import HotelModel
from app.infrastructure.models.habitacion_model import HabitacionModel
from app.infrastructure.models.reserva_model import ReservaModel
from app.infrastructure.models.estado_model import EstadoModel


def _require_admin(current_usuario):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403
    return None


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

    # ── Aggregate stats (without date/estado filters to show all-time totals)
    stats_q = (
        db.session.query(
            EstadoModel.nombre,
            db.func.count(ReservaModel.id).label('count'),
        )
        .join(ReservaModel, ReservaModel.id_estado == EstadoModel.id)
        .join(HabitacionModel, ReservaModel.id_habitacion == HabitacionModel.id)
        .filter(HabitacionModel.id_hotel.in_(hotel_ids))
        .group_by(EstadoModel.nombre)
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
    if not data or 'id_estado' not in data:
        return jsonify({'error': 'id_estado is required'}), 400

    id_usuario = current_usuario['id']

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

    nuevo_estado = EstadoModel.query.get(data['id_estado'])
    if not nuevo_estado:
        return jsonify({'error': 'Estado not found'}), 404

    reserva.id_estado = nuevo_estado.id
    db.session.commit()

    return jsonify({
        'id': reserva.id,
        'id_estado': reserva.id_estado,
        'estado_nombre': nuevo_estado.nombre,
    }), 200
