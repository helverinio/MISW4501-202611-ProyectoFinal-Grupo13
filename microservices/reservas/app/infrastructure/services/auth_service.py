import logging
import requests
from typing import Optional, Dict, Any
from app.infrastructure.services.circuit_breaker import get_circuit_breaker, CircuitBreakerError

logger = logging.getLogger(__name__)


class UsuariosAuthService:
    """Service to call the Usuarios microservice for token validation."""

    def __init__(self, base_url: str, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.base_url = base_url
        self._circuit_breaker = get_circuit_breaker(
            service_name='usuarios-auth-service',
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout
        )

    def validate_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Validate the access token by calling the usuarios microservice.
        Returns the usuario data if token is valid, None otherwise.
        Uses circuit breaker to fail gracefully if service is down.
        """
        try:
            return self._circuit_breaker.call(self._do_validate_token, access_token)
        except CircuitBreakerError as e:
            logger.warning(f"[RESERVAS] Circuit breaker open for usuarios service: {e}")
            return None
        except requests.RequestException as e:
            logger.error(f"[RESERVAS] !!! Usuarios service error: {str(e)}")
            return None

    def _do_validate_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Internal method that performs the actual HTTP call to validate token."""
        url = f"{self.base_url}/api/v1/auth/me"
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        logger.info(f"[RESERVAS] >>> Calling Usuarios service: GET {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 401:
                logger.info(f"[RESERVAS] <<< Usuarios service: Invalid or expired token")
                return None
            
            if response.status_code >= 400:
                logger.error(f"[RESERVAS] !!! Usuarios service error: {response.status_code} - {response.text}")
                return None
            
            result = response.json()
            logger.info(f"[RESERVAS] <<< Usuarios service responded: {response.status_code}")
            return result
        except requests.Timeout:
            logger.error(f"[RESERVAS] !!! Usuarios service timeout")
            return None
        except Exception as e:
            logger.error(f"[RESERVAS] !!! Error validating token: {str(e)}")
            return None

    def get_circuit_status(self) -> dict:
        """Return circuit breaker status for monitoring."""
        return self._circuit_breaker.get_status()


_usuarios_auth_service = None


def init_usuarios_auth_service(config):
    """Initialize the usuarios auth service singleton."""
    global _usuarios_auth_service
    usuarios_service_url = config.get('USUARIOS_SERVICE_URL', 'http://usuarios:5001')
    _usuarios_auth_service = UsuariosAuthService(usuarios_service_url)
    logger.info(f"[RESERVAS] Usuarios auth service initialized with URL: {usuarios_service_url}")
    return _usuarios_auth_service


def get_usuarios_auth_service():
    """Get the usuarios auth service singleton."""
    global _usuarios_auth_service
    if _usuarios_auth_service is None:
        raise RuntimeError("Usuarios auth service not initialized. Call init_usuarios_auth_service first.")
    return _usuarios_auth_service
