from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/notificaciones', methods=['POST'])
def create_notificacion():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_notificacion(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['GET'])
def get_notificacion(notificacion_id):
    result = get_service().get_notificacion(notificacion_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/notificaciones', methods=['GET'])
def get_all_notificaciones():
    result = get_service().get_all_notificaciones()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['PUT'])
def update_notificacion(notificacion_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_notificacion(notificacion_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/notificaciones/<notificacion_id>', methods=['DELETE'])
def delete_notificacion(notificacion_id):
    result = get_service().delete_notificacion(notificacion_id)
    return jsonify(result['data']), result['status_code']
