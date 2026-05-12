from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/device-tokens/<user_id>', methods=['GET'])
def get_device_tokens(user_id):
    result = get_service().get_device_tokens(user_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/device-tokens', methods=['POST'])
def register_device_token():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().register_device_token(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/device-tokens', methods=['DELETE'])
def unregister_device_token():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().unregister_device_token(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/push-notifications/send', methods=['POST'])
def send_push_notification():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().send_push_notification(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/push-notifications/send-to-reservation', methods=['POST'])
def send_push_notification_to_reservation():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().send_push_notification_to_reservation(data)
    return jsonify(result['data']), result['status_code']
