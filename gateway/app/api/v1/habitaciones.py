from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/habitaciones', methods=['POST'])
def create_habitacion():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_habitacion(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['GET'])
def get_habitacion(habitacion_id):
    result = get_service().get_habitacion(habitacion_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones', methods=['GET'])
def get_all_habitaciones():
    result = get_service().get_all_habitaciones()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['PUT'])
def update_habitacion(habitacion_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_habitacion(habitacion_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['DELETE'])
def delete_habitacion(habitacion_id):
    result = get_service().delete_habitacion(habitacion_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones/<habitacion_id>/tarifas', methods=['GET'])
def get_tarifas_by_habitacion(habitacion_id):
    result = get_service().get_tarifas_by_habitacion(habitacion_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/habitaciones/<habitacion_id>/reservas', methods=['GET'])
def get_reservas_by_habitacion(habitacion_id):
    result = get_service().get_reservas_by_habitacion(habitacion_id)
    return jsonify(result['data']), result['status_code']
