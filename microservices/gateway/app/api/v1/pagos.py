from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import PagosService


def get_pagos_service():
    return PagosService(current_app.config['PAGOS_SERVICE_URL'])


@api_v1_bp.route('/payments', methods=['POST'])
def create_payment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_pagos_service().create_payment(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    result = get_pagos_service().get_payment(payment_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/payments', methods=['GET'])
def get_all_payments():
    result = get_pagos_service().get_all_payments()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/payments/reservation/<reservation_id>', methods=['GET'])
def get_payment_by_reservation(reservation_id):
    result = get_pagos_service().get_payment_by_reservation(reservation_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/payments/<payment_id>/process', methods=['POST'])
def process_payment(payment_id):
    data = request.get_json(silent=True) or {}
    result = get_pagos_service().process_payment(payment_id, data)
    return jsonify(result['data']), result['status_code']
