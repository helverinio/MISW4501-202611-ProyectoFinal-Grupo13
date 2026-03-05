import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    EXT_PAYMENTS_URL = os.environ.get('EXT_PAYMENTS_URL', 'http://ext-payments:5001')
    # Webhook URL now points to gateway which routes to reservas
    PAGOS_WEBHOOK_URL = os.environ.get('PAGOS_WEBHOOK_URL', 'http://gateway:5000')
    
    # Message Queue Configuration (Amazon MQ compatible)
    MQ_HOST = os.environ.get('MQ_HOST', 'activemq')
    MQ_PORT = int(os.environ.get('MQ_PORT', '61613'))
    MQ_USERNAME = os.environ.get('MQ_USERNAME', 'admin')
    MQ_PASSWORD = os.environ.get('MQ_PASSWORD', 'admin')

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
