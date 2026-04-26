import uuid
from datetime import datetime
from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app import db
from app.infrastructure.models.tipo_habitacion_model import TipoHabitacionModel
from app.infrastructure.models.hotel_model import HotelModel


@api_v1_bp.route('/hoteles/<hotel_id>/tipos-habitacion', methods=['GET'])
@require_token
def get_tipos_habitacion_by_hotel(hotel_id, current_usuario=None):
    hotel = HotelModel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    tipos = TipoHabitacionModel.query.filter_by(id_hotel=hotel_id).all()
    return jsonify([_tipo_dict(t) for t in tipos])


@api_v1_bp.route('/hoteles/<hotel_id>/tipos-habitacion', methods=['POST'])
@require_token
def create_tipo_habitacion(hotel_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    hotel = HotelModel.query.get(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    data = request.get_json() or {}
    nombre = data.get('nombre')
    capacidad = data.get('capacidad')
    camas = data.get('camas')

    if not nombre or capacidad is None or camas is None:
        return jsonify({'error': 'nombre, capacidad and camas are required'}), 400

    tipo = TipoHabitacionModel(
        id=str(uuid.uuid4()),
        nombre=nombre,
        descripcion=data.get('descripcion'),
        capacidad=int(capacidad),
        camas=int(camas),
        id_hotel=hotel_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(tipo)
    db.session.commit()
    return jsonify(_tipo_dict(tipo)), 201


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['GET'])
@require_token
def get_tipo_habitacion(tipo_id, current_usuario=None):
    tipo = TipoHabitacionModel.query.get(tipo_id)
    if not tipo:
        return jsonify({'error': 'Tipo habitacion not found'}), 404
    return jsonify(_tipo_dict(tipo))


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['PUT'])
@require_token
def update_tipo_habitacion(tipo_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    tipo = TipoHabitacionModel.query.get(tipo_id)
    if not tipo:
        return jsonify({'error': 'Tipo habitacion not found'}), 404

    data = request.get_json() or {}
    if 'nombre' in data:
        tipo.nombre = data['nombre']
    if 'descripcion' in data:
        tipo.descripcion = data['descripcion']
    if 'capacidad' in data:
        tipo.capacidad = int(data['capacidad'])
    if 'camas' in data:
        tipo.camas = int(data['camas'])
    tipo.updated_at = datetime.utcnow()

    db.session.commit()
    return jsonify(_tipo_dict(tipo))


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['DELETE'])
@require_token
def delete_tipo_habitacion(tipo_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    tipo = TipoHabitacionModel.query.get(tipo_id)
    if not tipo:
        return jsonify({'error': 'Tipo habitacion not found'}), 404

    db.session.delete(tipo)
    db.session.commit()
    return jsonify({'message': 'Tipo habitacion deleted'}), 200


def _tipo_dict(tipo):
    return {
        'id': tipo.id,
        'nombre': tipo.nombre,
        'descripcion': tipo.descripcion,
        'capacidad': tipo.capacidad,
        'camas': tipo.camas,
        'id_hotel': tipo.id_hotel,
        'created_at': tipo.created_at.isoformat() if tipo.created_at else None,
        'updated_at': tipo.updated_at.isoformat() if tipo.updated_at else None,
    }
