import json
import logging
import ssl
import threading
import stomp
from datetime import datetime
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class PaymentStatusListener(stomp.ConnectionListener):
    RETRY_COUNT_HEADER = 'x-retry-count'
    
    def __init__(self, app, handler: Callable, connection, max_retries: int, 
                 dlq_topic: str, source_topic: str):
        self.app = app
        self.handler = handler
        self.connection = connection
        self.max_retries = max_retries
        self.dlq_topic = dlq_topic
        self.source_topic = source_topic

    def on_message(self, frame):
        message_id = frame.headers.get('message-id')
        subscription = frame.headers.get('subscription')
        retry_count = int(frame.headers.get(self.RETRY_COUNT_HEADER, '0'))
        
        try:
            logger.info(f"[MQ] Received message on {frame.headers.get('destination')} (retry: {retry_count}/{self.max_retries})")
            body = json.loads(frame.body)
            logger.debug(f"[MQ] Message body: {body}")
            
            with self.app.app_context():
                self.handler(body)
            
            # Manual ACK: acknowledge message after successful processing
            self.connection.ack(message_id, subscription)
            logger.debug(f"[MQ] Message acknowledged: {message_id}")
                
        except Exception as e:
            logger.error(f"[MQ] Error processing message: {str(e)}")
            self._handle_failed_message(frame, body if 'body' in dir() else None, retry_count, str(e))
            # Manual ACK: acknowledge after handling failure (retry or DLQ)
            self.connection.ack(message_id, subscription)

    def _handle_failed_message(self, frame, body: Optional[dict], retry_count: int, error: str):
        try:
            if body is None:
                body = json.loads(frame.body)
        except:
            body = {'raw_body': frame.body, 'parse_error': True}
        
        next_retry = retry_count + 1
        
        if next_retry > self.max_retries:
            logger.warning(f"[MQ] Max retries ({self.max_retries}) exceeded, sending to DLQ: {self.dlq_topic}")
            self._send_to_dlq(body, retry_count, error)
        else:
            logger.info(f"[MQ] Retrying message (attempt {next_retry}/{self.max_retries})")
            self._republish_for_retry(body, next_retry)

    def _republish_for_retry(self, body: dict, retry_count: int):
        try:
            headers = {
                self.RETRY_COUNT_HEADER: str(retry_count),
                'x-original-timestamp': datetime.utcnow().isoformat()
            }
            self.connection.send(
                destination=self.source_topic,
                body=json.dumps(body),
                headers=headers
            )
            logger.info(f"[MQ] Message republished for retry {retry_count}")
        except Exception as e:
            logger.error(f"[MQ] Failed to republish message for retry: {str(e)}")
            self._send_to_dlq(body, retry_count - 1, f"Republish failed: {str(e)}")

    def _send_to_dlq(self, body: dict, retry_count: int, error: str):
        try:
            dlq_message = {
                'original_message': body,
                'error': error,
                'retry_count': retry_count,
                'max_retries': self.max_retries,
                'failed_at': datetime.utcnow().isoformat(),
                'source_topic': self.source_topic
            }
            self.connection.send(
                destination=self.dlq_topic,
                body=json.dumps(dlq_message),
                headers={'x-dlq-reason': error[:200]}
            )
            logger.info(f"[MQ] Message sent to DLQ: {self.dlq_topic}")
            logger.debug(f"[MQ] DLQ message: {dlq_message}")
        except Exception as e:
            logger.error(f"[MQ] CRITICAL: Failed to send message to DLQ: {str(e)}")

    def on_error(self, frame):
        logger.error(f"[MQ] Error: {frame.body}")

    def on_connected(self, frame):
        logger.info("[MQ] Connected to ActiveMQ")

    def on_disconnected(self):
        logger.warning("[MQ] Disconnected from ActiveMQ")


class PaymentStatusSubscriber:
    QUEUE_PAYMENT_STATUS_UPDATED = '/queue/PaymentStatusUpdated'
    
    def __init__(self, app, host: str, port: int, username: str, password: str,
                 max_retries: int = 3, dlq_topic: str = '/topic/PaymentStatusUpdated.DLQ',
                 use_ssl: bool = False, ca_cert_path: Optional[str] = None):
        self.app = app
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.max_retries = max_retries
        self.dlq_topic = dlq_topic
        self.use_ssl = use_ssl
        self.ca_cert_path = ca_cert_path
        self._connection = None
        self._thread = None

    @classmethod
    def from_config(cls, app):
        from flask import current_app
        with app.app_context():
            return cls(
                app=app,
                host=current_app.config.get('MQ_HOST', 'activemq'),
                port=current_app.config.get('MQ_PORT', 61613),
                username=current_app.config.get('MQ_USERNAME', 'admin'),
                password=current_app.config.get('MQ_PASSWORD', 'admin'),
                max_retries=current_app.config.get('MQ_MAX_RETRIES', 3),
                dlq_topic=current_app.config.get('MQ_DLQ_TOPIC', '/topic/PaymentStatusUpdated.DLQ'),
                use_ssl=current_app.config.get('MQ_USE_SSL', False),
                ca_cert_path=current_app.config.get('MQ_CA_CERT_PATH')
            )

    def _handle_payment_status_updated(self, message: dict):
        from app.infrastructure.repositories.sqlalchemy_payment_repository import SQLAlchemyPaymentRepository
        import requests
        
        payment_intent_id = message.get('payment_intent_id')
        payment_status = message.get('status')
        
        if not payment_intent_id or not payment_status:
            raise ValueError(f"Invalid message: missing payment_intent_id or status")
        
        logger.info(f"[PAGOS] Processing PaymentStatusUpdated for payment_intent_id {payment_intent_id}, status: {payment_status}")
        
        repo = SQLAlchemyPaymentRepository()
        
        payment = repo.update_status_by_intent(payment_intent_id, payment_status)
        
        if not payment:
            raise ValueError(f"Payment not found for intent: {payment_intent_id}")
        
        logger.info(f"[PAGOS] Updated payment {payment.id} to status '{payment_status}'")
        
        # Send push notification for the payment status change
        self._send_payment_push_notification(payment, payment_status)

    def _send_payment_push_notification(self, payment, status: str):
        import requests
        
        status_titles = {
            'completado': 'Pago Exitoso',
            'fallido': 'Pago Fallido',
            'reembolsado': 'Pago Reembolsado',
        }
        status_bodies = {
            'completado': f'Tu pago de {payment.amount} {payment.currency} ha sido procesado exitosamente.',
            'fallido': f'Tu pago de {payment.amount} {payment.currency} no pudo ser procesado.',
            'reembolsado': f'Se ha reembolsado tu pago de {payment.amount} {payment.currency}.',
        }
        
        title = status_titles.get(status, f'Actualización de Pago')
        body = status_bodies.get(status, f'Tu pago ha cambiado a estado: {status}')
        
        try:
            from flask import current_app
            reservas_url = current_app.config.get('RESERVAS_SERVICE_URL', 'http://reservas:5004')
            
            payload = {
                'reservation_id': payment.reservation_id,
                'title': title,
                'body': body,
                'data': {
                    'type': 'payment_status_updated',
                    'payment_id': payment.id,
                    'reservation_id': payment.reservation_id,
                    'status': status,
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                }
            }
            
            response = requests.post(
                f'{reservas_url}/api/v1/push-notifications/send-to-reservation',
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"[PAGOS] Push notification sent for payment {payment.id}")
            else:
                logger.warning(f"[PAGOS] Push notification failed ({response.status_code}): {response.text}")
                
        except Exception as e:
            logger.error(f"[PAGOS] Failed to send push notification: {str(e)}")

    def start(self):
        def run_subscriber():
            try:
                self._connection = stomp.Connection([(self.host, self.port)])
                if self.use_ssl:
                    ssl_options = {'for_hosts': [(self.host, self.port)]}
                    if self.ca_cert_path:
                        ssl_options['ca_certs'] = self.ca_cert_path
                    else:
                        ssl_options['cert_reqs'] = ssl.CERT_NONE
                    self._connection.set_ssl(**ssl_options)
                listener = PaymentStatusListener(
                    app=self.app,
                    handler=self._handle_payment_status_updated,
                    connection=self._connection,
                    max_retries=self.max_retries,
                    dlq_topic=self.dlq_topic,
                    source_topic=self.QUEUE_PAYMENT_STATUS_UPDATED
                )
                self._connection.set_listener('payment_status', listener)
                self._connection.connect(self.username, self.password, wait=True)
                # Manual ACK mode: messages must be explicitly acknowledged
                # If not ACK'd, broker will redeliver on consumer disconnect
                self._connection.subscribe(
                    destination=self.QUEUE_PAYMENT_STATUS_UPDATED,
                    id='pagos-payment-subscriber',
                    ack='client'  # Requires manual ack() call
                )
                logger.info(f"[MQ] Subscribed to {self.QUEUE_PAYMENT_STATUS_UPDATED} (max_retries={self.max_retries}, dlq={self.dlq_topic})")
                
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
