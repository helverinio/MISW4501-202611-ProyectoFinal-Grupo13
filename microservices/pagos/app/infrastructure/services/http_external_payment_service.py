import logging
import requests
from typing import Optional, Dict, Any
from app.domain.services.external_payment_service import ExternalPaymentService
from app.infrastructure.services.circuit_breaker import get_circuit_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)


class HttpExternalPaymentService(ExternalPaymentService):
    def __init__(self, base_url: str, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.base_url = base_url
        self._circuit_breaker = get_circuit_breaker(
            service_name='ext-payments-service',
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout
        )
    
    def create_payment_intent(self, amount: float, currency: str, description: Optional[str] = None,
                              webhook_url: Optional[str] = None, reservation_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            return self._circuit_breaker.call(
                self._do_create_payment_intent,
                amount, currency, description, webhook_url, reservation_id
            )
        except CircuitBreakerError as e:
            logger.warning(f"[PAGOS] Circuit breaker open: {e}")
            return {'error': f'External payment service temporarily unavailable. Retry after {e.retry_after:.0f}s', 'circuit_open': True}
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return {'error': str(e)}

    def _do_create_payment_intent(self, amount: float, currency: str, description: Optional[str],
                                   webhook_url: Optional[str], reservation_id: Optional[str]) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/payment-intents"
        payload = {
            'amount': amount,
            'currency': currency,
            'description': description,
            'webhook_url': webhook_url,
            'reservation_id': reservation_id
        }
        logger.info(f"[PAGOS] >>> Calling ext-payments: POST {url}")
        logger.debug(f"[PAGOS]     Payload: {payload}")
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        logger.info(f"[PAGOS] <<< ext-payments responded: {response.status_code}")
        return result
    
    def make_payment(self, payment_intent_id: str, payment_method: str) -> Dict[str, Any]:
        try:
            return self._circuit_breaker.call(
                self._do_make_payment,
                payment_intent_id, payment_method
            )
        except CircuitBreakerError as e:
            logger.warning(f"[PAGOS] Circuit breaker open: {e}")
            return {'error': f'External payment service temporarily unavailable. Retry after {e.retry_after:.0f}s', 'circuit_open': True}
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return {'error': str(e)}

    def _do_make_payment(self, payment_intent_id: str, payment_method: str) -> Dict[str, Any]:
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
    
    def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self._circuit_breaker.call(self._do_get_payment, payment_id)
        except CircuitBreakerError as e:
            logger.warning(f"[PAGOS] Circuit breaker open: {e}")
            return None
        except requests.RequestException as e:
            logger.error(f"[PAGOS] !!! ext-payments error: {str(e)}")
            return None

    def _do_get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/api/v1/payments/{payment_id}"
        logger.info(f"[PAGOS] >>> Calling ext-payments: GET {url}")
        response = requests.get(url, timeout=30)
        if response.status_code == 404:
            logger.info(f"[PAGOS] <<< ext-payments: Payment not found")
            return None
        response.raise_for_status()
        logger.info(f"[PAGOS] <<< ext-payments responded: {response.status_code}")
        return response.json()

    def get_circuit_status(self) -> dict:
        """Return circuit breaker status for monitoring."""
        return self._circuit_breaker.get_status()
