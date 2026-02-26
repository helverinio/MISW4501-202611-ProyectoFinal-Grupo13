from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/tarifas', methods=['POST'])
def create_tarifa():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_tarifa(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['GET'])
def get_tarifa(tarifa_id):
    result = get_service().get_tarifa(tarifa_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tarifas', methods=['GET'])
def get_all_tarifas():
    result = get_service().get_all_tarifas()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['PUT'])
def update_tarifa(tarifa_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_tarifa(tarifa_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['DELETE'])
def delete_tarifa(tarifa_id):
    result = get_service().delete_tarifa(tarifa_id)
    return jsonify(result['data']), result['status_code']
