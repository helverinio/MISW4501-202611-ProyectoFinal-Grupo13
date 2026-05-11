import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    PAGOS_SERVICE_URL = os.environ.get('PAGOS_SERVICE_URL', 'http://pagos:5002')
    USUARIOS_SERVICE_URL = os.environ.get('USUARIOS_SERVICE_URL', 'http://usuarios:5003')
    DB_SCHEMA = os.environ.get('DB_SCHEMA')
    
    # Message Queue Configuration (Amazon MQ compatible)
    MQ_HOST = os.environ.get('MQ_HOST', 'activemq')
    MQ_PORT = int(os.environ.get('MQ_PORT', '61613'))
    MQ_USERNAME = os.environ.get('MQ_USERNAME', 'admin')
    MQ_PASSWORD = os.environ.get('MQ_PASSWORD', 'admin')
    # Optional TLS support for Amazon MQ (kept disabled by default for local compatibility)
    MQ_USE_SSL = os.environ.get('MQ_USE_SSL', 'false').lower() == 'true'
    MQ_CA_CERT_PATH = os.environ.get('MQ_CA_CERT_PATH')
    
    # Dead Letter Queue Configuration
    MQ_MAX_RETRIES = int(os.environ.get('MQ_MAX_RETRIES', '3'))
    MQ_DLQ_TOPIC = os.environ.get('MQ_DLQ_TOPIC', '/topic/PaymentStatusUpdated.DLQ')
    
    # Redis Configuration for Distributed Locking
    REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
    REDIS_DB = int(os.environ.get('REDIS_DB', '0'))
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)
    
    # Redlock Configuration
    REDIS_LOCK_TIMEOUT_SECONDS = int(os.environ.get('REDIS_LOCK_TIMEOUT_SECONDS', '10'))
    REDIS_LOCK_RETRY_TIMES = int(os.environ.get('REDIS_LOCK_RETRY_TIMES', '1'))
    REDIS_LOCK_RETRY_DELAY_MS = int(os.environ.get('REDIS_LOCK_RETRY_DELAY_MS', '50'))

    # Revenue report configuration
    TRAVELHUB_COMMISSION_PERCENTAGE = float(
        os.environ.get('TRAVELHUB_COMMISSION_PERCENTAGE', '12.0')
    )

    # Firebase Configuration for Push Notifications
    FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@reservas-db:5432/reservas')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
