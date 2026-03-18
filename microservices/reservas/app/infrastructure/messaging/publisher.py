import json
import logging
import stomp
from typing import Optional
from flask import current_app


logger = logging.getLogger(__name__)


class MessagePublisher:
    QUEUE_PAYMENT_STATUS_UPDATED = '/queue/PaymentStatusUpdated'
    
    def __init__(self, host: str = None, port: int = None, username: str = None, password: str = None):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self._connection: Optional[stomp.Connection] = None
    
    @classmethod
    def from_config(cls) -> 'MessagePublisher':
        return cls(
            host=current_app.config.get('MQ_HOST', 'activemq'),
            port=current_app.config.get('MQ_PORT', 61613),
            username=current_app.config.get('MQ_USERNAME', 'admin'),
            password=current_app.config.get('MQ_PASSWORD', 'admin')
        )
    
    def _get_connection(self) -> stomp.Connection:
        if self._connection is None or not self._connection.is_connected():
            self._connection = stomp.Connection([(self.host, self.port)])
            self._connection.connect(self.username, self.password, wait=True)
            logger.info(f"[MQ] Connected to ActiveMQ at {self.host}:{self.port}")
        return self._connection
    
    def publish(self, destination: str, message: dict, headers: dict = None) -> bool:
        try:
            conn = self._get_connection()
            body = json.dumps(message) if isinstance(message, dict) else str(message)
            
            msg_headers = {'content-type': 'application/json'}
            if headers:
                msg_headers.update(headers)
            
            conn.send(destination=destination, body=body, headers=msg_headers)
            logger.info(f"[MQ] Published message to {destination}")
            logger.debug(f"[MQ] Message body: {body}")
            return True
        except Exception as e:
            logger.error(f"[MQ] Failed to publish message to {destination}: {str(e)}")
            return False
    
    def publish_payment_status_updated(self, event_data: dict) -> bool:
        return self.publish(self.QUEUE_PAYMENT_STATUS_UPDATED, event_data)
    
    def disconnect(self):
        if self._connection and self._connection.is_connected():
            self._connection.disconnect()
            logger.info("[MQ] Disconnected from ActiveMQ")
