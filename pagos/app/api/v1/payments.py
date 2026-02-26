from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    RegisterPaymentUseCase, 
    ProcessPaymentUseCase,
    UpdatePaymentStatusUseCase,
    GetPaymentUseCase
)
from app.infrastructure.repositories import SQLAlchemyPaymentRepository
from app.infrastructure.services import HttpExternalPaymentService
from app.infrastructure.messaging import MessagePublisher, PaymentStatusUpdatedEvent

def get_repository():
    return SQLAlchemyPaymentRepository()

def get_external_service():
    return HttpExternalPaymentService(current_app.config['EXT_PAYMENTS_URL'])

def get_webhook_base_url():
    return current_app.config.get('PAGOS_WEBHOOK_URL', 'http://pagos:5002')

@api_v1_bp.route('/payments', methods=['POST'])
def register_payment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    reservation_id = data.get('reservation_id')
    amount = data.get('amount')
    currency = data.get('currency', 'USD')
    payment_method = data.get('payment_method')
    description = data.get('description')
    
    if not reservation_id or amount is None or not payment_method:
        return jsonify({'error': 'reservation_id, amount, and payment_method are required'}), 400
    
    use_case = RegisterPaymentUseCase(
        get_repository(), 
        get_external_service(),
        get_webhook_base_url()
    )
    result = use_case.execute(reservation_id, amount, currency, payment_method, description)
    
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result), 201

@api_v1_bp.route('/payments/<payment_id>/process', methods=['POST'])
def process_payment(payment_id):
    use_case = ProcessPaymentUseCase(get_repository(), get_external_service())
    result = use_case.execute(payment_id)
    
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result), 200

@api_v1_bp.route('/payments/webhook', methods=['POST'])
def payment_webhook():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    payment_intent_id = data.get('payment_intent_id')
    status = data.get('status')
    
    if not payment_intent_id or not status:
        return jsonify({'error': 'payment_intent_id and status are required'}), 400
    
    current_app.logger.info(f"[PAGOS] Webhook received: payment_intent_id={payment_intent_id}, status={status}")
    
    use_case = UpdatePaymentStatusUseCase(get_repository())
    result = use_case.execute(payment_intent_id, status)
    
    if not result:
        current_app.logger.error(f"[PAGOS] Payment not found for intent: {payment_intent_id}")
        return jsonify({'error': 'Payment not found'}), 404
    
    current_app.logger.info(f"[PAGOS] Payment status updated to '{status}' for payment {result['id']}")
    
    try:
        event = PaymentStatusUpdatedEvent.from_payment(result)
        publisher = MessagePublisher.from_config()
        publisher.publish_payment_status_updated(event.to_dict())
        current_app.logger.info(f"[PAGOS] Published PaymentStatusUpdated event for payment {result['id']}")
    except Exception as e:
        current_app.logger.error(f"[PAGOS] Failed to publish PaymentStatusUpdated event: {str(e)}")
    
    return jsonify(result), 200

@api_v1_bp.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    use_case = GetPaymentUseCase(get_repository(), get_external_service())
    result = use_case.execute(payment_id)
    
    if not result:
        return jsonify({'error': 'Payment not found'}), 404
    
    return jsonify(result)

@api_v1_bp.route('/payments', methods=['GET'])
def get_all_payments():
    repository = get_repository()
    payments = repository.find_all()
    return jsonify([{
        'id': p.id,
        'external_payment_id': p.external_payment_id,
        'payment_intent_id': p.payment_intent_id,
        'reservation_id': p.reservation_id,
        'amount': p.amount,
        'currency': p.currency,
        'status': p.status,
        'payment_method': p.payment_method,
        'created_at': p.created_at.isoformat(),
        'updated_at': p.updated_at.isoformat()
    } for p in payments])

@api_v1_bp.route('/payments/reservation/<reservation_id>', methods=['GET'])
def get_payment_by_reservation(reservation_id):
    repository = get_repository()
    payment = repository.find_by_reservation_id(reservation_id)
    
    if not payment:
        return jsonify({'error': 'Payment not found for reservation'}), 404
    
    return jsonify({
        'id': payment.id,
        'external_payment_id': payment.external_payment_id,
        'payment_intent_id': payment.payment_intent_id,
        'reservation_id': payment.reservation_id,
        'amount': payment.amount,
        'currency': payment.currency,
        'status': payment.status,
        'payment_method': payment.payment_method,
        'created_at': payment.created_at.isoformat(),
        'updated_at': payment.updated_at.isoformat()
    })
