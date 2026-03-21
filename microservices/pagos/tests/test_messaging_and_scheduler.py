import json
from contextlib import contextmanager

from app.infrastructure.messaging.events import PaymentStatusUpdatedEvent
from app.infrastructure.messaging.publisher import MessagePublisher
from app.infrastructure.messaging.subscriber import PaymentStatusListener, PaymentStatusSubscriber
from app.infrastructure.services.payment_abandonment_scheduler import PaymentAbandonmentScheduler


@contextmanager
def _app_context():
    yield


class DummyApp:
    def app_context(self):
        return _app_context()


class DummyConn:
    def __init__(self):
        self.sent = []
        self.acks = []
        self.connected = False

    def connect(self, username, password, wait=True):
        self.connected = True

    def is_connected(self):
        return self.connected

    def send(self, destination, body, headers=None):
        self.sent.append({"destination": destination, "body": body, "headers": headers or {}})

    def ack(self, message_id, subscription):
        self.acks.append((message_id, subscription))

    def disconnect(self):
        self.connected = False

    def set_listener(self, name, listener):
        self.listener = listener

    def subscribe(self, destination, id, ack):
        self.subscription = {"destination": destination, "id": id, "ack": ack}


class Frame:
    def __init__(self, body, retry="0"):
        self.body = body
        self.headers = {
            "message-id": "mid-1",
            "subscription": "sub-1",
            "destination": "/queue/PaymentStatusUpdated",
            "x-retry-count": retry,
        }


def test_payment_status_event_serialization():
    event = PaymentStatusUpdatedEvent.from_payment(
        {
            "id": "p1",
            "payment_intent_id": "i1",
            "reservation_id": "r1",
            "status": "completado",
            "amount": 100,
            "currency": "USD",
            "updated_at": "2026-01-01T00:00:00",
        }
    )

    as_dict = event.to_dict()
    assert as_dict["payment_id"] == "p1"

    as_json = event.to_json()
    payload = json.loads(as_json)
    assert payload["status"] == "completado"


def test_message_publisher_publish_and_disconnect(monkeypatch):
    dummy = DummyConn()

    monkeypatch.setattr("app.infrastructure.messaging.publisher.stomp.Connection", lambda cfg: dummy)

    pub = MessagePublisher(host="mq", port=61613, username="u", password="p")
    ok = pub.publish("/topic/a", {"hello": "world"})
    assert ok is True
    assert dummy.sent[0]["destination"] == "/topic/a"

    ok2 = pub.publish_payment_status_updated({"payment_id": "p1"})
    assert ok2 is True

    pub.disconnect()
    assert dummy.connected is False


def test_message_publisher_publish_failure(monkeypatch):
    class BrokenConn(DummyConn):
        def send(self, destination, body, headers=None):
            raise RuntimeError("cannot send")

    dummy = BrokenConn()
    monkeypatch.setattr("app.infrastructure.messaging.publisher.stomp.Connection", lambda cfg: dummy)

    pub = MessagePublisher(host="mq", port=61613, username="u", password="p")
    ok = pub.publish("/topic/a", {"hello": "world"})
    assert ok is False


def test_payment_status_listener_success_and_failure_paths():
    app = DummyApp()
    conn = DummyConn()

    calls = {"ok": 0}

    def good_handler(body):
        calls["ok"] += 1

    listener = PaymentStatusListener(
        app=app,
        handler=good_handler,
        connection=conn,
        max_retries=2,
        dlq_topic="/topic/dlq",
        source_topic="/queue/PaymentStatusUpdated",
    )

    frame_ok = Frame(body=json.dumps({"payment_intent_id": "i1", "status": "completado"}))
    listener.on_message(frame_ok)
    assert calls["ok"] == 1
    assert conn.acks[-1] == ("mid-1", "sub-1")

    def failing_handler(body):
        raise ValueError("boom")

    listener_fail = PaymentStatusListener(
        app=app,
        handler=failing_handler,
        connection=conn,
        max_retries=1,
        dlq_topic="/topic/dlq",
        source_topic="/queue/PaymentStatusUpdated",
    )

    frame_retry = Frame(body=json.dumps({"payment_intent_id": "i1", "status": "completado"}), retry="0")
    listener_fail.on_message(frame_retry)
    assert any(msg["destination"] == "/queue/PaymentStatusUpdated" for msg in conn.sent)

    frame_dlq = Frame(body=json.dumps({"payment_intent_id": "i1", "status": "completado"}), retry="1")
    listener_fail.on_message(frame_dlq)
    assert any(msg["destination"] == "/topic/dlq" for msg in conn.sent)


def test_subscriber_handle_payment_status_updated(monkeypatch):
    class FakeRepo:
        def __init__(self):
            self.called = False

        def update_status_by_intent(self, payment_intent_id, status):
            self.called = True
            if payment_intent_id == "missing":
                return None
            return type("P", (), {"id": "pay-1"})()

    import app.infrastructure.messaging.subscriber as subscriber_module

    monkeypatch.setattr(
        "app.infrastructure.repositories.sqlalchemy_payment_repository.SQLAlchemyPaymentRepository",
        FakeRepo,
    )

    subscriber = PaymentStatusSubscriber(
        app=DummyApp(),
        host="mq",
        port=61613,
        username="u",
        password="p",
        max_retries=2,
        dlq_topic="/topic/dlq",
    )

    subscriber._handle_payment_status_updated({"payment_intent_id": "intent-1", "status": "completado"})

    try:
        subscriber._handle_payment_status_updated({"payment_intent_id": "missing", "status": "completado"})
        assert False, "Expected ValueError"
    except ValueError:
        assert True

    try:
        subscriber._handle_payment_status_updated({"status": "completado"})
        assert False, "Expected ValueError"
    except ValueError:
        assert True


def test_scheduler_process_marks_abandoned(monkeypatch):
    class FakeRepo:
        def find_stale_pending(self, minutes):
            return [type("P", (), {"id": "pay-1", "created_at": "old"})()]

        def mark_as_abandoned(self, payment_id):
            return type("P", (), {"id": payment_id})()

    monkeypatch.setattr(
        "app.infrastructure.repositories.sqlalchemy_payment_repository.SQLAlchemyPaymentRepository",
        FakeRepo,
    )

    scheduler = PaymentAbandonmentScheduler(app=DummyApp(), check_interval_seconds=1, stale_minutes=1)
    scheduler._process_abandoned_payments()


def test_subscriber_start_and_stop(monkeypatch):
    class InstantStopConn(DummyConn):
        def connect(self, username, password, wait=True):
            self.connected = False

    dummy_conn = InstantStopConn()

    monkeypatch.setattr("app.infrastructure.messaging.subscriber.stomp.Connection", lambda cfg: dummy_conn)
    subscriber = PaymentStatusSubscriber(
        app=DummyApp(),
        host="mq",
        port=61613,
        username="u",
        password="p",
        max_retries=1,
        dlq_topic="/topic/dlq",
    )

    subscriber.start()
    # Force stop to break loop deterministically.
    subscriber.stop()

    assert subscriber._thread is not None
