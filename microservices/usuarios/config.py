import os
from typing import Optional, Union


def _as_bool(value: Optional[Union[str, bool]], default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', '3600'))  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', '604800'))  # 7 days
    MFA_SECRET_ENCRYPTION_KEY = os.environ.get('MFA_SECRET_ENCRYPTION_KEY', 'q9_XAAswDA8QfOlAGWFDGFKbHVOzx9nK6BXQYaQG_9I=')
    MFA_ISSUER = os.environ.get('MFA_ISSUER', 'TravelHub')
    ADMIN_SETUP_BASE_URL = os.environ.get('ADMIN_SETUP_BASE_URL', 'http://localhost:4201/setup-admin')
    ADMIN_MAX_LOGIN_ATTEMPTS = int(os.environ.get('ADMIN_MAX_LOGIN_ATTEMPTS', '5'))
    ADMIN_LOCK_MINUTES = int(os.environ.get('ADMIN_LOCK_MINUTES', '15'))
    ADMIN_MFA_CHALLENGE_EXPIRES = int(os.environ.get('ADMIN_MFA_CHALLENGE_EXPIRES', '300'))
    DB_SCHEMA = os.environ.get('DB_SCHEMA')
    EMAILJS_ENABLED = _as_bool(os.environ.get('EMAILJS_ENABLED', 'true'), default=True)
    EMAILJS_ENDPOINT = os.environ.get('EMAILJS_ENDPOINT', 'https://api.emailjs.com/api/v1.0/email/send')
    EMAILJS_SERVICE_ID = os.environ.get('EMAILJS_SERVICE_ID', '')
    EMAILJS_PUBLIC_KEY = os.environ.get('EMAILJS_PUBLIC_KEY', '')
    EMAILJS_PRIVATE_KEY = os.environ.get('EMAILJS_PRIVATE_KEY', '')
    EMAILJS_VERIFICATION_TEMPLATE_ID = os.environ.get('EMAILJS_VERIFICATION_TEMPLATE_ID', '')
    EMAILJS_ALLOWED_ORIGIN = os.environ.get('EMAILJS_ALLOWED_ORIGIN', 'http://localhost:4200')
    EMAIL_VERIFICATION_LINK_BASE_URL = os.environ.get(
        'EMAIL_VERIFICATION_LINK_BASE_URL',
        'http://localhost:4200/verify-email',
    )
    EMAIL_VERIFICATION_TOKEN_EXPIRES = int(os.environ.get('EMAIL_VERIFICATION_TOKEN_EXPIRES', '86400'))
    EMAIL_VERIFICATION_PENDING_STATUS = os.environ.get(
        'EMAIL_VERIFICATION_PENDING_STATUS',
        'PENDING_EMAIL',
    )
    EMAIL_VERIFICATION_ACTIVE_STATUS = os.environ.get('EMAIL_VERIFICATION_ACTIVE_STATUS', 'ACTIVE')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@usuarios-db:5432/usuarios')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
