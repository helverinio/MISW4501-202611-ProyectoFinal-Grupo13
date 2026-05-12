import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    EXT_PAYMENTS_URL = os.environ.get('EXT_PAYMENTS_URL', 'http://ext-payments:5001')
    DB_SCHEMA = os.environ.get('DB_SCHEMA')
    # Webhook URL now points to gateway which routes to reservas
    PAGOS_WEBHOOK_URL = os.environ.get('PAGOS_WEBHOOK_URL', 'http://gateway:5000')
    
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

    # Reservas service URL for push notifications
    RESERVAS_SERVICE_URL = os.environ.get('RESERVAS_SERVICE_URL', 'http://reservas:5000')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@pagos-db:5432/pagos')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
