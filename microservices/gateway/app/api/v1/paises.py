from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/paises', methods=['POST'])
def create_pais():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_pais(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/paises/<pais_id>', methods=['GET'])
def get_pais(pais_id):
    result = get_service().get_pais(pais_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/paises', methods=['GET'])
def get_all_paises():
    result = get_service().get_all_paises()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/paises/<pais_id>', methods=['PUT'])
def update_pais(pais_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_pais(pais_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/paises/<pais_id>', methods=['DELETE'])
def delete_pais(pais_id):
    result = get_service().delete_pais(pais_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/paises/<pais_id>/ciudades', methods=['GET'])
def get_ciudades_by_pais(pais_id):
    result = get_service().get_ciudades_by_pais(pais_id)
    return jsonify(result['data']), result['status_code']
