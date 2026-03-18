from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/estados', methods=['POST'])
def create_estado():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_estado(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/estados/<estado_id>', methods=['GET'])
def get_estado(estado_id):
    result = get_service().get_estado(estado_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/estados', methods=['GET'])
def get_all_estados():
    result = get_service().get_all_estados()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/estados/<estado_id>', methods=['PUT'])
def update_estado(estado_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_estado(estado_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/estados/<estado_id>', methods=['DELETE'])
def delete_estado(estado_id):
    result = get_service().delete_estado(estado_id)
    return jsonify(result['data']), result['status_code']
