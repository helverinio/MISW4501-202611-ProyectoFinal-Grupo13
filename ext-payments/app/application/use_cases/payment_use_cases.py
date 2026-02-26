import logging
import requests
import threading
from typing import Optional
from app.domain.entities.payment import Payment, PaymentIntent
from app.domain.repositories.payment_repository import PaymentRepository, PaymentIntentRepository

logger = logging.getLogger(__name__)

class CreatePaymentIntentUseCase:
    def __init__(self, repository: PaymentIntentRepository):
        self.repository = repository
    
    def execute(self, amount: float, currency: str, description: Optional[str] = None,
                webhook_url: Optional[str] = None) -> PaymentIntent:
        payment_intent = PaymentIntent.create(amount, currency, description, webhook_url)
        return self.repository.save(payment_intent)

class MakePaymentUseCase:
    def __init__(self, payment_repo: PaymentRepository, intent_repo: PaymentIntentRepository):
        self.payment_repo = payment_repo
        self.intent_repo = intent_repo
    
    def execute(self, payment_intent_id: str, payment_method: str) -> Optional[Payment]:
        intent = self.intent_repo.find_by_id(payment_intent_id)
        if not intent:
            return None
        
        if intent.status != 'pending':
            return None
        
        payment = Payment.create(
            payment_intent_id=payment_intent_id,
            amount=intent.amount,
            currency=intent.currency,
            payment_method=payment_method
        )
        
        self.intent_repo.update_status(payment_intent_id, 'completed')
        saved_payment = self.payment_repo.save(payment)
        
        if intent.webhook_url:
            thread = threading.Thread(
                target=self._notify_webhook,
                args=(intent.webhook_url, payment_intent_id, 'completado')
            )
            thread.start()
        
        return saved_payment
    
    def _notify_webhook(self, webhook_url: str, payment_intent_id: str, status: str):
        try:
            payload = {
                'payment_intent_id': payment_intent_id,
                'status': status
            }
            logger.info(f"[EXT-PAYMENTS] >>> Calling webhook: POST {webhook_url}")
            logger.debug(f"[EXT-PAYMENTS]     Payload: {payload}")
            response = requests.post(webhook_url, json=payload, timeout=10)
            logger.info(f"[EXT-PAYMENTS] <<< Webhook responded: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"[EXT-PAYMENTS] !!! Webhook error: {str(e)}")

class GetPaymentUseCase:
    def __init__(self, repository: PaymentRepository):
        self.repository = repository
    
    def execute(self, payment_id: str) -> Optional[Payment]:
        return self.repository.find_by_id(payment_id)
