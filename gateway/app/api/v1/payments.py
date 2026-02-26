from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import PagosService

def get_service():
    return PagosService(current_app.config['PAGOS_SERVICE_URL'])

@api_v1_bp.route('/payments', methods=['POST'])
def make_payment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    result = get_service().make_payment(data)
    return jsonify(result['data']), result['status_code']

@api_v1_bp.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    result = get_service().get_payment(payment_id)
    return jsonify(result['data']), result['status_code']
