import logging
import requests
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class PagosService:
    def __init__(self, base_url: str):
        self.base_url = base_url

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
        """
        try:
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
        except requests.RequestException as e:
            logger.error(f"[RESERVAS] !!! Pagos service error: {str(e)}")
            return {'error': str(e)}

    def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Get payment details from the pagos microservice.
        """
        try:
            url = f"{self.base_url}/api/v1/payments/{payment_id}"
            logger.info(f"[RESERVAS] >>> Calling Pagos service: GET {url}")
            response = requests.get(url, timeout=30)
            if response.status_code == 404:
                logger.info(f"[RESERVAS] <<< Pagos service: Payment not found")
                return None
            response.raise_for_status()
            logger.info(f"[RESERVAS] <<< Pagos service responded: {response.status_code}")
            return response.json()
        except requests.RequestException as e:
            logger.error(f"[RESERVAS] !!! Pagos service error: {str(e)}")
            return None
