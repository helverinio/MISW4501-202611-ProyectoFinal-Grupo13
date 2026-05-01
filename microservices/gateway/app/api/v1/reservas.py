from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/reservas', methods=['POST'])
def create_reserva():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_reserva(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/<reserva_id>', methods=['GET'])
def get_reserva(reserva_id):
    result = get_service().get_reserva(reserva_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas', methods=['GET'])
def get_all_reservas():
    result = get_service().get_all_reservas()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/<reserva_id>', methods=['PUT'])
def update_reserva(reserva_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_reserva(reserva_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/<reserva_id>', methods=['DELETE'])
def delete_reserva(reserva_id):
    result = get_service().delete_reserva(reserva_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios/<usuario_id>/reservas', methods=['GET'])
def get_reservas_by_usuario(usuario_id):
    result = get_service().get_reservas_by_usuario(usuario_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios/<usuario_id>/reservas/recently-viewed', methods=['GET'])
def get_recently_viewed_by_usuario(usuario_id):
    limit = request.args.get('limit', 3, type=int)
    result = get_service().get_recently_viewed_by_usuario(usuario_id, limit)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/<reserva_id>/pagos', methods=['GET'])
def get_pagos_by_reserva(reserva_id):
    result = get_service().get_pagos_by_reserva(reserva_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/<reserva_id>/notificaciones', methods=['GET'])
def get_notificaciones_by_reserva(reserva_id):
    result = get_service().get_notificaciones_by_reserva(reserva_id, request.args.get('tipo'))
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reservas/webhook/pms', methods=['POST'])
def create_reserva_pms_webhook():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_reserva_pms_webhook(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/payments/webhook', methods=['POST'])
def payment_webhook():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().payment_webhook(data)
    return jsonify(result['data']), result['status_code']
