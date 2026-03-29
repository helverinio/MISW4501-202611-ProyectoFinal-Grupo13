from flask import request, jsonify
from datetime import datetime
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateNotificacionUseCase, GetNotificacionUseCase, GetAllNotificacionesUseCase,
    GetNotificacionesByReservaUseCase, UpdateNotificacionUseCase, DeleteNotificacionUseCase
)
from app.infrastructure.repositories import SQLAlchemyNotificacionRepository


def get_repository():
    return SQLAlchemyNotificacionRepository()


def parse_datetime(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')


@api_v1_bp.route('/notificaciones', methods=['POST'])
@require_token
def create_notificacion(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    fecha_notif = parse_datetime(data.get('fecha_notif'))
    titulo = data.get('titulo')
    id_reserva = data.get('id_reserva')
    descripcion = data.get('descripcion')

    if not all([fecha_notif, titulo, id_reserva]):
        return jsonify({'error': 'fecha_notif, titulo, and id_reserva are required'}), 400

    use_case = CreateNotificacionUseCase(get_repository())
    notificacion = use_case.execute(fecha_notif, titulo, id_reserva, descripcion)

    return jsonify({
        'id': notificacion.id,
        'fecha_notif': notificacion.fecha_notif.isoformat(),
        'titulo': notificacion.titulo,
        'descripcion': notificacion.descripcion,
        'id_reserva': notificacion.id_reserva
    }), 201


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['GET'])
@require_token
def get_notificacion(notificacion_id, current_usuario=None):
    use_case = GetNotificacionUseCase(get_repository())
    notificacion = use_case.execute(notificacion_id)

    if not notificacion:
        return jsonify({'error': 'Notificacion not found'}), 404

    return jsonify({
        'id': notificacion.id,
        'fecha_notif': notificacion.fecha_notif.isoformat(),
        'titulo': notificacion.titulo,
        'descripcion': notificacion.descripcion,
        'id_reserva': notificacion.id_reserva
    })


@api_v1_bp.route('/notificaciones', methods=['GET'])
@require_token
def get_all_notificaciones(current_usuario=None):
    use_case = GetAllNotificacionesUseCase(get_repository())
    notificaciones = use_case.execute()

    return jsonify([{
        'id': n.id,
        'fecha_notif': n.fecha_notif.isoformat(),
        'titulo': n.titulo,
        'descripcion': n.descripcion,
        'id_reserva': n.id_reserva
    } for n in notificaciones])


@api_v1_bp.route('/reservas/<reserva_id>/notificaciones', methods=['GET'])
@require_token
def get_notificaciones_by_reserva(reserva_id, current_usuario=None):
    use_case = GetNotificacionesByReservaUseCase(get_repository())
    notificaciones = use_case.execute(reserva_id)

    return jsonify([{
        'id': n.id,
        'fecha_notif': n.fecha_notif.isoformat(),
        'titulo': n.titulo,
        'descripcion': n.descripcion,
        'id_reserva': n.id_reserva
    } for n in notificaciones])


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['PUT'])
@require_token
def update_notificacion(notificacion_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    update_data = {}
    if 'fecha_notif' in data:
        update_data['fecha_notif'] = parse_datetime(data['fecha_notif'])
    if 'titulo' in data:
        update_data['titulo'] = data['titulo']
    if 'descripcion' in data:
        update_data['descripcion'] = data['descripcion']
    if 'id_reserva' in data:
        update_data['id_reserva'] = data['id_reserva']

    use_case = UpdateNotificacionUseCase(get_repository())
    notificacion = use_case.execute(notificacion_id, **update_data)

    if not notificacion:
        return jsonify({'error': 'Notificacion not found'}), 404

    return jsonify({
        'id': notificacion.id,
        'fecha_notif': notificacion.fecha_notif.isoformat(),
        'titulo': notificacion.titulo,
        'descripcion': notificacion.descripcion,
        'id_reserva': notificacion.id_reserva
    })


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['DELETE'])
@require_token
def delete_notificacion(notificacion_id, current_usuario=None):
    use_case = DeleteNotificacionUseCase(get_repository())
    deleted = use_case.execute(notificacion_id)

    if not deleted:
        return jsonify({'error': 'Notificacion not found'}), 404

    return jsonify({'message': 'Notificacion deleted successfully'})
