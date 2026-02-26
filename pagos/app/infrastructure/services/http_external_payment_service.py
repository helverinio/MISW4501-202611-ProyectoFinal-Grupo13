import logging
import requests
from typing import Optional, Dict, Any
from app.domain.services.external_payment_service import ExternalPaymentService

logger = logging.getLogger(__name__)


class HttpExternalPaymentService(ExternalPaymentService):
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def create_payment_intent(self, amount: float, currency: str, description: Optional[str] = None,
                              webhook_url: Optional[str] = None) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/payment-intents"
            payload = {
                'amount': amount,
                'currency': currency,
                'description': description,
                'webhook_url': webhook_url
            }
            logger.info(f"[PAGOS] >>> Calling ext-payments: POST {url}")
            logger.debug(f"[PAGOS]     Payload: {payload}")
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f"[PAGOS] <<< ext-payments responded: {response.status_code}")
            return result
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return {'error': str(e)}
    
    def make_payment(self, payment_intent_id: str, payment_method: str) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/payments"
            payload = {
                'payment_intent_id': payment_intent_id,
                'payment_method': payment_method
            }
            logger.info(f"[PAGOS] >>> Calling ext-payments: POST {url}")
            logger.debug(f"[PAGOS]     Payload: {payload}")
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f"[PAGOS] <<< ext-payments responded: {response.status_code}")
            return result
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return {'error': str(e)}
    
    def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        try:
            url = f"{self.base_url}/api/v1/payments/{payment_id}"
            logger.info(f"[PAGOS] >>> Calling ext-payments: GET {url}")
            response = requests.get(url, timeout=30)
            if response.status_code == 404:
                logger.info(f"[PAGOS] <<< ext-payments: Payment not found")
                return None
            response.raise_for_status()
            logger.info(f"[PAGOS] <<< ext-payments responded: {response.status_code}")
            return response.json()
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return None
