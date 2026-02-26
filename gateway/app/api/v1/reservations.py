from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService

def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])

@api_v1_bp.route('/reservations', methods=['POST'])
def create_reservation():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = get_service().create_reservation(data)
    return jsonify(result['data']), result['status_code']

@api_v1_bp.route('/reservations/<reservation_id>', methods=['GET'])
def get_reservation(reservation_id):
    result = get_service().get_reservation(reservation_id)
    return jsonify(result['data']), result['status_code']

@api_v1_bp.route('/reservations', methods=['GET'])
def get_all_reservations():
    result = get_service().get_all_reservations()
    return jsonify(result['data']), result['status_code']

@api_v1_bp.route('/reservations/<reservation_id>', methods=['PUT'])
def update_reservation(reservation_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = get_service().update_reservation(reservation_id, data)
    return jsonify(result['data']), result['status_code']

@api_v1_bp.route('/reservations/<reservation_id>', methods=['DELETE'])
def delete_reservation(reservation_id):
    result = get_service().delete_reservation(reservation_id)
    return jsonify(result['data']), result['status_code']
