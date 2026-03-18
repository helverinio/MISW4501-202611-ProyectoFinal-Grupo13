import time

import pytest

from app.infrastructure.services.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
)
from app.infrastructure.services.http_external_payment_service import HttpExternalPaymentService


class DummyResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {"id": "ok"}

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def test_circuit_breaker_open_and_recovery_cycle():
    cb = CircuitBreaker("ext", failure_threshold=1, recovery_timeout=0.1, success_threshold=1)

    cb.record_failure()
    assert cb.state == CircuitState.OPEN

    with pytest.raises(CircuitBreakerError):
        cb.call(lambda: "never")

    time.sleep(0.12)
    assert cb.state == CircuitState.HALF_OPEN

    result = cb.call(lambda: "ok")
    assert result == "ok"
    assert cb.state == CircuitState.CLOSED


def test_circuit_breaker_get_status_contains_core_fields():
    cb = CircuitBreaker("svc", failure_threshold=2, recovery_timeout=5, success_threshold=1)
    status = cb.get_status()

    assert status["service"] == "svc"
    assert status["state"] in {"closed", "open", "half_open"}


def test_http_external_service_success_paths(monkeypatch):
    class PassThroughCB:
        def call(self, func, *args, **kwargs):
            return func(*args, **kwargs)

        def get_status(self):
            return {"state": "closed"}

    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.get_circuit_breaker",
        lambda **kwargs: PassThroughCB(),
    )

    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.requests.post",
        lambda url, json, timeout: DummyResponse(201, {"id": "intent-1"}),
    )
    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.requests.get",
        lambda url, timeout: DummyResponse(200, {"id": "pay-1"}),
    )

    svc = HttpExternalPaymentService("http://ext")

    intent = svc.create_payment_intent(100, "USD", "desc", "http://webhook", "res-1")
    assert intent["id"] == "intent-1"

    payment = svc.make_payment("intent-1", "card")
    assert payment["id"] == "intent-1"

    fetched = svc.get_payment("pay-1")
    assert fetched["id"] == "pay-1"
    assert svc.get_circuit_status()["state"] == "closed"


def test_http_external_service_error_paths(monkeypatch):
    class OpenCB:
        def call(self, func, *args, **kwargs):
            raise CircuitBreakerError("ext-payments-service", retry_after=12)

        def get_status(self):
            return {"state": "open"}

    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.get_circuit_breaker",
        lambda **kwargs: OpenCB(),
    )

    svc = HttpExternalPaymentService("http://ext")

    intent = svc.create_payment_intent(100, "USD")
    assert intent["circuit_open"] is True

    payment = svc.make_payment("intent-1", "card")
    assert payment["circuit_open"] is True

    fetched = svc.get_payment("pay-1")
    assert fetched is None


class HttpErr(Exception):
    pass


def test_http_external_service_request_exception_paths(monkeypatch):
    class PassThroughCB:
        def call(self, func, *args, **kwargs):
            return func(*args, **kwargs)

        def get_status(self):
            return {"state": "closed"}

    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.get_circuit_breaker",
        lambda **kwargs: PassThroughCB(),
    )
    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.requests.RequestException",
        HttpErr,
    )

    def failing_post(url, json, timeout):
        raise HttpErr("post fail")

    def failing_get(url, timeout):
        raise HttpErr("get fail")

    monkeypatch.setattr("app.infrastructure.services.http_external_payment_service.requests.post", failing_post)
    monkeypatch.setattr("app.infrastructure.services.http_external_payment_service.requests.get", failing_get)

    svc = HttpExternalPaymentService("http://ext")

    assert "post fail" in svc.create_payment_intent(100, "USD")["error"]
    assert "post fail" in svc.make_payment("intent", "card")["error"]
    assert svc.get_payment("pay-1") is None


def test_http_external_service_get_payment_404(monkeypatch):
    class PassThroughCB:
        def call(self, func, *args, **kwargs):
            return func(*args, **kwargs)

        def get_status(self):
            return {"state": "closed"}

    class NotFoundResponse:
        status_code = 404

        def raise_for_status(self):
            return None

        def json(self):
            return {}

    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.get_circuit_breaker",
        lambda **kwargs: PassThroughCB(),
    )
    monkeypatch.setattr(
        "app.infrastructure.services.http_external_payment_service.requests.get",
        lambda url, timeout: NotFoundResponse(),
    )

    svc = HttpExternalPaymentService("http://ext")
    assert svc.get_payment("missing") is None
