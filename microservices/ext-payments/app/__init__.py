import logging
import sys
from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import config
import time

db = SQLAlchemy()
migrate = Migrate()

def setup_logging(app):
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '[%(asctime)s] [EXT-PAYMENTS] %(levelname)s - %(message)s',
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
    
    CORS(app, resources={r"/api/v1/*": {"origins": ["http://localhost:4200", "http://localhost:8080"]}})
    
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
    # Public alias used by ALB path-based routing to expose ext-payments separately.
    app.register_blueprint(api_v1_bp, name='api_v1_public', url_prefix='/ext-payments/api/v1')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'ext-payments'}
    
    logger.info("Ext-payments microservice started")
    return app
