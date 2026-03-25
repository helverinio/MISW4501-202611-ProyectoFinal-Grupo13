import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    RESERVAS_SERVICE_URL = os.environ.get('RESERVAS_SERVICE_URL', 'http://reservas:5000')
    PAGOS_SERVICE_URL = os.environ.get('PAGOS_SERVICE_URL', 'http://pagos:5002')
    USUARIOS_SERVICE_URL = os.environ.get('USUARIOS_SERVICE_URL', 'http://usuarios:5003')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
