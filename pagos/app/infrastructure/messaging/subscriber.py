import json
import logging
import threading
import stomp
from typing import Callable

logger = logging.getLogger(__name__)


class PaymentStatusListener(stomp.ConnectionListener):
    def __init__(self, app, handler: Callable):
        self.app = app
        self.handler = handler

    def on_message(self, frame):
        try:
            logger.info(f"[MQ] Received message on {frame.headers.get('destination')}")
            body = json.loads(frame.body)
            logger.debug(f"[MQ] Message body: {body}")
            
            with self.app.app_context():
                self.handler(body)
                
        except Exception as e:
            logger.error(f"[MQ] Error processing message: {str(e)}")

    def on_error(self, frame):
        logger.error(f"[MQ] Error: {frame.body}")

    def on_connected(self, frame):
        logger.info("[MQ] Connected to ActiveMQ")

    def on_disconnected(self):
        logger.warning("[MQ] Disconnected from ActiveMQ")


class PaymentStatusSubscriber:
    TOPIC_PAYMENT_STATUS_UPDATED = '/topic/PaymentStatusUpdated'
    
    def __init__(self, app, host: str, port: int, username: str, password: str):
        self.app = app
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self._connection = None
        self._thread = None

    def _handle_payment_status_updated(self, message: dict):
        from app.infrastructure.repositories.sqlalchemy_payment_repository import SQLAlchemyPaymentRepository
        
        payment_intent_id = message.get('payment_intent_id')
        payment_status = message.get('status')
        
        logger.info(f"[PAGOS] Processing PaymentStatusUpdated for payment_intent_id {payment_intent_id}, status: {payment_status}")
        
        repo = SQLAlchemyPaymentRepository()
        
        payment = repo.update_status_by_intent(payment_intent_id, payment_status)
        
        if not payment:
            logger.error(f"[PAGOS] Payment not found for intent: {payment_intent_id}")
            return
        
        logger.info(f"[PAGOS] Updated payment {payment.id} to status '{payment_status}'")

    def start(self):
        def run_subscriber():
            try:
                self._connection = stomp.Connection([(self.host, self.port)])
                listener = PaymentStatusListener(self.app, self._handle_payment_status_updated)
                self._connection.set_listener('payment_status', listener)
                self._connection.connect(self.username, self.password, wait=True)
                self._connection.subscribe(
                    destination=self.TOPIC_PAYMENT_STATUS_UPDATED,
                    id='pagos-payment-subscriber',
                    ack='auto'
                )
                logger.info(f"[MQ] Subscribed to {self.TOPIC_PAYMENT_STATUS_UPDATED}")
                
                while self._connection.is_connected():
                    import time
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"[MQ] Subscriber error: {str(e)}")

        self._thread = threading.Thread(target=run_subscriber, daemon=True)
        self._thread.start()
        logger.info("[MQ] Payment status subscriber started in background thread")

    def stop(self):
        if self._connection and self._connection.is_connected():
            self._connection.disconnect()
            logger.info("[MQ] Subscriber disconnected")
