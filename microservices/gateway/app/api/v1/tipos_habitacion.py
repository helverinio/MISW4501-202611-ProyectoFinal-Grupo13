from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/hoteles/<hotel_id>/tipos-habitacion', methods=['GET'])
def get_tipos_habitacion_by_hotel(hotel_id):
    result = get_service().get_tipos_habitacion_by_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>/tipos-habitacion', methods=['POST'])
def create_tipo_habitacion(hotel_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_tipo_habitacion(hotel_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['GET'])
def get_tipo_habitacion(tipo_id):
    result = get_service().get_tipo_habitacion(tipo_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['PUT'])
def update_tipo_habitacion(tipo_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_tipo_habitacion(tipo_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tipos-habitacion/<tipo_id>', methods=['DELETE'])
def delete_tipo_habitacion(tipo_id):
    result = get_service().delete_tipo_habitacion(tipo_id)
    return jsonify(result['data']), result['status_code']
