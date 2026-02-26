from typing import Optional, Dict, Any
from app.domain.entities.payment import Payment
from app.domain.repositories.payment_repository import PaymentRepository
from app.domain.services.external_payment_service import ExternalPaymentService

class RegisterPaymentUseCase:
    def __init__(self, repository: PaymentRepository, external_service: ExternalPaymentService,
                 webhook_base_url: str):
        self.repository = repository
        self.external_service = external_service
        self.webhook_base_url = webhook_base_url
    
    def execute(self, reservation_id: str, amount: float, currency: str, 
                payment_method: str, description: Optional[str] = None) -> Dict[str, Any]:
        existing_payment = self.repository.find_by_reservation_id(reservation_id)
        if existing_payment:
            return {'error': f'Payment already exists for reservation {reservation_id}'}
        
        webhook_url = f"{self.webhook_base_url}/api/v1/payments/webhook"
        
        intent_response = self.external_service.create_payment_intent(
            amount, currency, description, webhook_url
        )
        
        if 'error' in intent_response:
            return {'error': intent_response['error']}
        
        payment_intent_id = intent_response['id']
        
        payment = Payment.create(
            payment_intent_id=payment_intent_id,
            reservation_id=reservation_id,
            amount=amount,
            currency=currency,
            payment_method=payment_method,
            status='pendiente'
        )
        
        saved_payment = self.repository.save(payment)
        
        return {
            'id': saved_payment.id,
            'payment_intent_id': saved_payment.payment_intent_id,
            'reservation_id': saved_payment.reservation_id,
            'amount': saved_payment.amount,
            'currency': saved_payment.currency,
            'status': saved_payment.status,
            'payment_method': saved_payment.payment_method,
            'created_at': saved_payment.created_at.isoformat(),
            'updated_at': saved_payment.updated_at.isoformat()
        }

class ProcessPaymentUseCase:
    def __init__(self, repository: PaymentRepository, external_service: ExternalPaymentService):
        self.repository = repository
        self.external_service = external_service
    
    def execute(self, payment_id: str) -> Dict[str, Any]:
        payment = self.repository.find_by_id(payment_id)
        if not payment:
            return {'error': 'Payment not found'}
        
        if payment.status != 'pendiente':
            return {'error': f'Payment is not in pendiente status, current status: {payment.status}'}
        
        payment_response = self.external_service.make_payment(
            payment.payment_intent_id, payment.payment_method
        )
        
        if 'error' in payment_response:
            return {'error': payment_response['error']}
        
        return {
            'id': payment.id,
            'payment_intent_id': payment.payment_intent_id,
            'reservation_id': payment.reservation_id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status,
            'payment_method': payment.payment_method,
            'message': 'Payment processing initiated, waiting for webhook confirmation'
        }

class UpdatePaymentStatusUseCase:
    def __init__(self, repository: PaymentRepository):
        self.repository = repository
    
    def execute(self, payment_intent_id: str, status: str) -> Optional[Dict[str, Any]]:
        payment = self.repository.update_status_by_intent(payment_intent_id, status)
        if not payment:
            return None
        
        return {
            'id': payment.id,
            'payment_intent_id': payment.payment_intent_id,
            'reservation_id': payment.reservation_id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status,
            'payment_method': payment.payment_method,
            'created_at': payment.created_at.isoformat(),
            'updated_at': payment.updated_at.isoformat()
        }

class GetPaymentUseCase:
    def __init__(self, repository: PaymentRepository, external_service: ExternalPaymentService):
        self.repository = repository
        self.external_service = external_service
    
    def execute(self, payment_id: str) -> Optional[Dict[str, Any]]:
        payment = self.repository.find_by_id(payment_id)
        if not payment:
            return None
        
        external_payment = None
        if payment.external_payment_id:
            external_payment = self.external_service.get_payment(payment.external_payment_id)
        
        return {
            'id': payment.id,
            'external_payment_id': payment.external_payment_id,
            'payment_intent_id': payment.payment_intent_id,
            'reservation_id': payment.reservation_id,
            'amount': payment.amount,
            'currency': payment.currency,
            'status': payment.status,
            'payment_method': payment.payment_method,
            'created_at': payment.created_at.isoformat(),
            'updated_at': payment.updated_at.isoformat(),
            'external_payment_details': external_payment
        }
