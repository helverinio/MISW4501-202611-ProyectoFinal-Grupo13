import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    PAGOS_SERVICE_URL = os.environ.get('PAGOS_SERVICE_URL', 'http://pagos:5002')
    
    # Message Queue Configuration (Amazon MQ compatible)
    MQ_HOST = os.environ.get('MQ_HOST', 'activemq')
    MQ_PORT = int(os.environ.get('MQ_PORT', '61613'))
    MQ_USERNAME = os.environ.get('MQ_USERNAME', 'admin')
    MQ_PASSWORD = os.environ.get('MQ_PASSWORD', 'admin')

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
