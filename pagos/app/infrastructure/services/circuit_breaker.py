import logging
import time
import threading
from enum import Enum
from typing import Callable, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation, requests pass through
    OPEN = "open"          # Circuit tripped, requests fail fast
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerError(Exception):
    """Raised when circuit breaker is open and request is rejected."""
    def __init__(self, service_name: str, retry_after: float):
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(f"Circuit breaker OPEN for {service_name}. Retry after {retry_after:.1f}s")


class CircuitBreaker:
    """
    Circuit Breaker pattern implementation for resilient HTTP calls.
    
    States:
    - CLOSED: Normal operation. Failures are counted.
    - OPEN: Service is considered down. Requests fail fast without calling the service.
    - HALF_OPEN: After timeout, allows one test request to check if service recovered.
    
    Configuration:
    - failure_threshold: Number of failures before opening circuit (default: 5)
    - recovery_timeout: Seconds to wait before trying again (default: 30)
    - success_threshold: Successful calls in HALF_OPEN to close circuit (default: 2)
    """
    
    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2
    ):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._lock = threading.Lock()
    
    @property
    def state(self) -> CircuitState:
        with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._state = CircuitState.HALF_OPEN
                    self._success_count = 0
                    logger.info(f"[CIRCUIT] {self.service_name}: OPEN -> HALF_OPEN (attempting recovery)")
            return self._state
    
    def _should_attempt_reset(self) -> bool:
        return (
            self._last_failure_time is not None and
            time.time() - self._last_failure_time >= self.recovery_timeout
        )
    
    def _time_until_retry(self) -> float:
        if self._last_failure_time is None:
            return 0
        elapsed = time.time() - self._last_failure_time
        return max(0, self.recovery_timeout - elapsed)
    
    def record_success(self):
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    logger.info(f"[CIRCUIT] {self.service_name}: HALF_OPEN -> CLOSED (service recovered)")
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0
    
    def record_failure(self):
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.time()
            
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                logger.warning(f"[CIRCUIT] {self.service_name}: HALF_OPEN -> OPEN (recovery failed)")
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._state = CircuitState.OPEN
                    logger.warning(
                        f"[CIRCUIT] {self.service_name}: CLOSED -> OPEN "
                        f"(failures: {self._failure_count}/{self.failure_threshold})"
                    )
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function through the circuit breaker.
        
        Raises CircuitBreakerError if circuit is OPEN.
        """
        current_state = self.state
        
        if current_state == CircuitState.OPEN:
            retry_after = self._time_until_retry()
            logger.warning(f"[CIRCUIT] {self.service_name}: Request rejected (circuit OPEN, retry in {retry_after:.1f}s)")
            raise CircuitBreakerError(self.service_name, retry_after)
        
        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap a function with circuit breaker protection."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self.call(func, *args, **kwargs)
        return wrapper
    
    def get_status(self) -> dict:
        """Return current circuit breaker status for monitoring."""
        return {
            'service': self.service_name,
            'state': self.state.value,
            'failure_count': self._failure_count,
            'failure_threshold': self.failure_threshold,
            'success_count': self._success_count if self._state == CircuitState.HALF_OPEN else None,
            'retry_after': self._time_until_retry() if self._state == CircuitState.OPEN else None
        }


# Global circuit breaker instances for shared state across requests
_circuit_breakers: dict[str, CircuitBreaker] = {}
_cb_lock = threading.Lock()


def get_circuit_breaker(
    service_name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    success_threshold: int = 2
) -> CircuitBreaker:
    """
    Get or create a circuit breaker for a service.
    Circuit breakers are shared across requests to maintain state.
    """
    with _cb_lock:
        if service_name not in _circuit_breakers:
            _circuit_breakers[service_name] = CircuitBreaker(
                service_name=service_name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                success_threshold=success_threshold
            )
            logger.info(f"[CIRCUIT] Created circuit breaker for {service_name}")
        return _circuit_breakers[service_name]


def get_all_circuit_breaker_status() -> list[dict]:
    """Return status of all circuit breakers for monitoring."""
    with _cb_lock:
        return [cb.get_status() for cb in _circuit_breakers.values()]
