from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreatePaymentIntentUseCase,
    MakePaymentUseCase,
    GetPaymentUseCase
)
from app.infrastructure.repositories import (
    SQLAlchemyPaymentRepository,
    SQLAlchemyPaymentIntentRepository
)

def get_payment_repository():
    return SQLAlchemyPaymentRepository()

def get_intent_repository():
    return SQLAlchemyPaymentIntentRepository()

@api_v1_bp.route('/payment-intents', methods=['POST'])
def create_payment_intent():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    amount = data.get('amount')
    currency = data.get('currency', 'USD')
    description = data.get('description')
    webhook_url = data.get('webhook_url')
    
    if amount is None:
        return jsonify({'error': 'amount is required'}), 400
    
    use_case = CreatePaymentIntentUseCase(get_intent_repository())
    intent = use_case.execute(amount, currency, description, webhook_url)
    
    return jsonify({
        'id': intent.id,
        'amount': intent.amount,
        'currency': intent.currency,
        'description': intent.description,
        'status': intent.status,
        'webhook_url': intent.webhook_url,
        'created_at': intent.created_at.isoformat()
    }), 201

@api_v1_bp.route('/payments', methods=['POST'])
def make_payment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    payment_intent_id = data.get('payment_intent_id')
    payment_method = data.get('payment_method')
    
    if not payment_intent_id or not payment_method:
        return jsonify({'error': 'payment_intent_id and payment_method are required'}), 400
    
    use_case = MakePaymentUseCase(get_payment_repository(), get_intent_repository())
    payment = use_case.execute(payment_intent_id, payment_method)
    
    if not payment:
        return jsonify({'error': 'Payment intent not found or already processed'}), 400
    
    return jsonify({
        'id': payment.id,
        'payment_intent_id': payment.payment_intent_id,
        'amount': payment.amount,
        'currency': payment.currency,
        'status': payment.status,
        'payment_method': payment.payment_method,
        'created_at': payment.created_at.isoformat(),
        'updated_at': payment.updated_at.isoformat()
    }), 201

@api_v1_bp.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    use_case = GetPaymentUseCase(get_payment_repository())
    payment = use_case.execute(payment_id)
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    return jsonify({
        'id': payment.id,
        'payment_intent_id': payment.payment_intent_id,
        'amount': payment.amount,
        'currency': payment.currency,
        'status': payment.status,
        'payment_method': payment.payment_method,
        'created_at': payment.created_at.isoformat(),
        'updated_at': payment.updated_at.isoformat()
    })
