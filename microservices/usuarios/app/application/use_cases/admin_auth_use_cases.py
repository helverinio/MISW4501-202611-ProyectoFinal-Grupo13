from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import bcrypt
import jwt
from flask import current_app

from app.application.services import CryptoService, TOTPService
from app.application.use_cases.auth_use_cases import issue_tokens_for_user
from app.domain.entities.usuario import Usuario
from app.domain.repositories.token_repository import TokenRepository
from app.domain.repositories.usuario_repository import UsuarioRepository


class RegisterAdminUseCase:
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository
        self.crypto_service = CryptoService()
        self.totp_service = TOTPService()

    def execute(self, nombre: str, email: str, contrasena: str, usuario: Optional[str] = None) -> Dict[str, Any]:
        secret = self.totp_service.generate_secret()
        encrypted_secret = self.crypto_service.encrypt(secret)

        hashed_password = bcrypt.hashpw(contrasena.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = Usuario.create(
            nombre=nombre,
            email=email,
            usuario=usuario or email,
            contrasena=hashed_password,
            role='ADMIN',
            status='PENDING_MFA',
            mfa_secret_encrypted=encrypted_secret,
            mfa_enabled=False,
        )

        admin = self.usuario_repository.save(admin)

        otpauth_uri = self.totp_service.build_otpauth_uri(admin.email, secret)
        setup_base_url = current_app.config.get('ADMIN_SETUP_BASE_URL', 'http://localhost:4200/setup-admin')
        setup_url = f"{setup_base_url}?email={admin.email}"

        return {
            'id': admin.id,
            'email': admin.email,
            'role': admin.role,
            'status': admin.status,
            'setup_url': setup_url,
            'otpauth_uri': otpauth_uri,
        }


class VerifyAdminSetupUseCase:
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository
        self.crypto_service = CryptoService()
        self.totp_service = TOTPService()

    def execute(self, email: str, code: str) -> bool:
        admin = self.usuario_repository.find_by_email(email)
        if not admin or admin.role != 'ADMIN' or not admin.mfa_secret_encrypted:
            return False

        secret = self.crypto_service.decrypt(admin.mfa_secret_encrypted)
        is_valid = self.totp_service.verify_code(secret, code)
        if not is_valid:
            return False

        admin.mfa_enabled = True
        admin.status = 'ACTIVE'
        admin.mfa_confirmed_at = datetime.utcnow()
        admin.failed_login_attempts = 0
        admin.locked_until = None
        admin.updated_at = datetime.utcnow()
        self.usuario_repository.update(admin)
        return True


class AdminLoginStep1UseCase:
    def __init__(self, usuario_repository: UsuarioRepository):
        self.usuario_repository = usuario_repository

    def execute(self, identifier: str, contrasena: str) -> Optional[Dict[str, Any]]:
        normalized_identifier = identifier.strip()
        admin = self.usuario_repository.find_by_email(normalized_identifier)
        if not admin:
            admin = self.usuario_repository.find_by_usuario(normalized_identifier)

        if not admin or admin.role != 'ADMIN':
            return None

        if admin.locked_until and admin.locked_until > datetime.utcnow():
            return {
                'locked': True,
                'locked_until': admin.locked_until.isoformat(),
            }

        if not bcrypt.checkpw(contrasena.encode('utf-8'), admin.contrasena.encode('utf-8')):
            max_attempts = current_app.config.get('ADMIN_MAX_LOGIN_ATTEMPTS', 5)
            lock_minutes = current_app.config.get('ADMIN_LOCK_MINUTES', 15)
            admin.failed_login_attempts = (admin.failed_login_attempts or 0) + 1
            if admin.failed_login_attempts >= max_attempts:
                admin.locked_until = datetime.utcnow() + timedelta(minutes=lock_minutes)
            admin.updated_at = datetime.utcnow()
            self.usuario_repository.update(admin)
            return None

        if admin.status != 'ACTIVE' or not admin.mfa_enabled:
            return {'setup_required': True}

        admin.failed_login_attempts = 0
        admin.locked_until = None
        admin.updated_at = datetime.utcnow()
        self.usuario_repository.update(admin)

        now = datetime.utcnow()
        challenge_exp = now + timedelta(seconds=current_app.config.get('ADMIN_MFA_CHALLENGE_EXPIRES', 300))
        challenge_token = jwt.encode(
            {
                'sub': admin.id,
                'email': admin.email,
                'type': 'admin_mfa_challenge',
                'exp': challenge_exp,
                'iat': now,
            },
            current_app.config.get('JWT_SECRET_KEY'),
            algorithm='HS256',
        )

        return {
            'mfa_required': True,
            'challenge_token': challenge_token,
            'expires_in': int((challenge_exp - now).total_seconds()),
        }


class AdminLoginStep2UseCase:
    def __init__(self, usuario_repository: UsuarioRepository, token_repository: TokenRepository):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository
        self.crypto_service = CryptoService()
        self.totp_service = TOTPService()

    def execute(self, challenge_token: str, code: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(
                challenge_token,
                current_app.config.get('JWT_SECRET_KEY'),
                algorithms=['HS256'],
            )
        except jwt.PyJWTError:
            return None

        if payload.get('type') != 'admin_mfa_challenge':
            return None

        admin = self.usuario_repository.find_by_id(payload.get('sub'))
        if not admin or admin.role != 'ADMIN' or not admin.mfa_secret_encrypted:
            return None

        secret = self.crypto_service.decrypt(admin.mfa_secret_encrypted)
        if not self.totp_service.verify_code(secret, code):
            return None

        admin.updated_at = datetime.utcnow()
        self.usuario_repository.update(admin)
        return issue_tokens_for_user(admin, self.token_repository, include_mfa_verified=True)
