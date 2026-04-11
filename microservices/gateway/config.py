import os

class Config:
    _DEFAULT_CORS_ORIGINS = [
        'https://d3hkc7ho8q0zd0.cloudfront.net',
        'https://d21pufplfuuvcd.cloudfront.net',
        'http://localhost:4200',
        'http://127.0.0.1:4200',
    ]

    _raw_cors_origins = os.environ.get('CORS_ORIGINS', '')
    _parsed_cors_origins = [
        origin.strip()
        for origin in _raw_cors_origins.split(',')
        if origin.strip()
    ]

    # If deployment leaves the placeholder unresolved, fallback to safe defaults.
    if (not _parsed_cors_origins) or any('__CORS_ORIGINS__' in origin for origin in _parsed_cors_origins):
        CORS_ORIGINS = _DEFAULT_CORS_ORIGINS
    else:
        CORS_ORIGINS = _parsed_cors_origins

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
