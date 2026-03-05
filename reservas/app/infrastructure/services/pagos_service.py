import logging
import requests
from typing import Optional, Dict, Any
from app.infrastructure.services.circuit_breaker import get_circuit_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)


class PagosService:
    def __init__(self, base_url: str, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.base_url = base_url
        self._circuit_breaker = get_circuit_breaker(
            service_name='pagos-service',
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout
        )

    def create_payment(
        self,
        reservation_id: str,
        amount: float,
        currency: str = 'USD',
        payment_method: str = 'card',
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a payment by calling the pagos microservice.
        The pagos microservice will then call ext-payments.
        Uses circuit breaker to fail fast if service is down.
        """
        try:
            return self._circuit_breaker.call(
                self._do_create_payment,
                reservation_id, amount, currency, payment_method, description
            )
        except CircuitBreakerError as e:
            logger.warning(f"[RESERVAS] Circuit breaker open: {e}")
            return {'error': f'Payment service temporarily unavailable. Retry after {e.retry_after:.0f}s', 'circuit_open': True}
        except requests.RequestException as e:
            logger.error(f"[RESERVAS] !!! Pagos service error: {str(e)}")
            return {'error': str(e)}

    def _do_create_payment(
        self,
        reservation_id: str,
        amount: float,
        currency: str,
        payment_method: str,
        description: Optional[str]
    ) -> Dict[str, Any]:
        """Internal method that performs the actual HTTP call."""
        url = f"{self.base_url}/api/v1/payments"
        payload = {
            'reservation_id': reservation_id,
            'amount': amount,
            'currency': currency,
            'payment_method': payment_method,
            'description': description
        }
        logger.info(f"[RESERVAS] >>> Calling Pagos service: POST {url}")
        logger.debug(f"[RESERVAS]     Payload: {payload}")
        response = requests.post(url, json=payload, timeout=30)
        result = response.json()
        if response.status_code >= 400:
            logger.error(f"[RESERVAS] !!! Pagos service error: {result}")
            return {'error': result.get('error', 'Payment service error')}
        logger.info(f"[RESERVAS] <<< Pagos service responded: {response.status_code}")
        return result

    def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Get payment details from the pagos microservice.
        Uses circuit breaker to fail fast if service is down.
        """
        try:
            return self._circuit_breaker.call(self._do_get_payment, payment_id)
        except CircuitBreakerError as e:
            logger.warning(f"[RESERVAS] Circuit breaker open: {e}")
            return None
        except requests.RequestException as e:
            logger.error(f"[RESERVAS] !!! Pagos service error: {str(e)}")
            return None

    def _do_get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """Internal method that performs the actual HTTP call."""
        url = f"{self.base_url}/api/v1/payments/{payment_id}"
        logger.info(f"[RESERVAS] >>> Calling Pagos service: GET {url}")
        response = requests.get(url, timeout=30)
        if response.status_code == 404:
            logger.info(f"[RESERVAS] <<< Pagos service: Payment not found")
            return None
        response.raise_for_status()
        logger.info(f"[RESERVAS] <<< Pagos service responded: {response.status_code}")
        return response.json()

    def get_circuit_status(self) -> dict:
        """Return circuit breaker status for monitoring."""
        return self._circuit_breaker.get_status()
