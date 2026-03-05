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
    
    # Dead Letter Queue Configuration
    MQ_MAX_RETRIES = int(os.environ.get('MQ_MAX_RETRIES', '3'))
    MQ_DLQ_TOPIC = os.environ.get('MQ_DLQ_TOPIC', '/topic/PaymentStatusUpdated.DLQ')
    
    # Redis Configuration for Distributed Locking
    REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
    REDIS_PORT = int(os.environ.get('REDIS_PORT', '6379'))
    REDIS_DB = int(os.environ.get('REDIS_DB', '0'))
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)
    
    # Redlock Configuration
    REDIS_LOCK_TIMEOUT_SECONDS = int(os.environ.get('REDIS_LOCK_TIMEOUT_SECONDS', '30'))
    REDIS_LOCK_RETRY_TIMES = int(os.environ.get('REDIS_LOCK_RETRY_TIMES', '3'))
    REDIS_LOCK_RETRY_DELAY_MS = int(os.environ.get('REDIS_LOCK_RETRY_DELAY_MS', '200'))

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
