import logging
import sys
from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import config
import time

db = SQLAlchemy()
migrate = Migrate()
redis_lock_service = None

def setup_logging(app):
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '[%(asctime)s] [RESERVAS] %(levelname)s %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    # Configura el root logger para que los módulos internos también propaguen sus trazas
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)
    return app.logger

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    logger = setup_logging(app)
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize Usuarios Auth Service
    try:
        from app.infrastructure.services import init_usuarios_auth_service
        init_usuarios_auth_service(app.config)
        logger.info("Usuarios auth service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Usuarios auth service: {str(e)}")
    
    global redis_lock_service
    try:
        from app.infrastructure.services import init_redis_lock_service
        redis_lock_service = init_redis_lock_service(app.config)
        health = redis_lock_service.health_check()
        if health['status'] == 'healthy':
            logger.info("Redis lock service initialized successfully")
        else:
            logger.warning(f"Redis lock service unhealthy: {health.get('error')}")
    except Exception as e:
        logger.warning(f"Could not initialize Redis lock service: {str(e)}")
        redis_lock_service = None
    
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
        health_status = {'status': 'healthy', 'service': 'reservas'}
        
        if redis_lock_service:
            redis_health = redis_lock_service.health_check()
            health_status['redis'] = redis_health
        else:
            health_status['redis'] = {'status': 'unavailable'}
        
        return health_status
    
    logger.info("Reservas microservice started")
    return app
