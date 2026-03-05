import logging
import sys
from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import config
import time

db = SQLAlchemy()
migrate = Migrate()

def setup_logging(app):
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '[%(asctime)s] [PAGOS] %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)
    return app.logger

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    logger = setup_logging(app)
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    @app.before_request
    def log_request_start():
        g.start_time = time.time()
        logger.info(f">>> Incoming {request.method} {request.path}")
        if request.get_json(silent=True):
            logger.debug(f"    Request body: {request.get_json()}")
    
    @app.after_request
    def log_request_end(response):
        duration = time.time() - g.get('start_time', time.time())
        logger.info(f"<<< {request.method} {request.path} - {response.status_code} ({duration:.3f}s)")
        return response
    
    from app.api.v1 import api_v1_bp
    app.register_blueprint(api_v1_bp, url_prefix='/api/v1')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'pagos'}
    
    # Start MQ subscriber for payment status updates from reservas
    from app.infrastructure.messaging import PaymentStatusSubscriber
    subscriber = PaymentStatusSubscriber(
        app=app,
        host=app.config.get('MQ_HOST', 'activemq'),
        port=app.config.get('MQ_PORT', 61613),
        username=app.config.get('MQ_USERNAME', 'admin'),
        password=app.config.get('MQ_PASSWORD', 'admin'),
        max_retries=app.config.get('MQ_MAX_RETRIES', 3),
        dlq_topic=app.config.get('MQ_DLQ_TOPIC', '/topic/PaymentStatusUpdated.DLQ')
    )
    subscriber.start()
    
    logger.info("Pagos microservice started")
    return app
