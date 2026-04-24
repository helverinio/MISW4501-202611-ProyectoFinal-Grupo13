import uuid
from datetime import datetime
from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app import db
from app.infrastructure.models.admin_hotel_model import AdminHotelModel
from app.infrastructure.models.hotel_model import HotelModel


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
