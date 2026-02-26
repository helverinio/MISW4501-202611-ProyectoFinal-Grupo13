from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/ciudades', methods=['POST'])
def create_ciudad():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_ciudad(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['GET'])
def get_ciudad(ciudad_id):
    result = get_service().get_ciudad(ciudad_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/ciudades', methods=['GET'])
def get_all_ciudades():
    result = get_service().get_all_ciudades()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['PUT'])
def update_ciudad(ciudad_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_ciudad(ciudad_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['DELETE'])
def delete_ciudad(ciudad_id):
    result = get_service().delete_ciudad(ciudad_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/ciudades/<ciudad_id>/hoteles', methods=['GET'])
def get_hoteles_by_ciudad(ciudad_id):
    result = get_service().get_hoteles_by_ciudad(ciudad_id)
    return jsonify(result['data']), result['status_code']
