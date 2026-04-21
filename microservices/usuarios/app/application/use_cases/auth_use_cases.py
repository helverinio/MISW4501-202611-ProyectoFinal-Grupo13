from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import bcrypt
import jwt
import secrets
from flask import current_app
from app.domain.entities.token import Token
from app.domain.entities.usuario import Usuario
from app.domain.repositories.usuario_repository import UsuarioRepository
from app.domain.repositories.token_repository import TokenRepository


def issue_tokens_for_user(
    user: Usuario,
    token_repository: TokenRepository,
    include_mfa_verified: bool = False,
) -> Dict[str, Any]:
    access_token_expires = timedelta(seconds=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    refresh_token_expires = timedelta(seconds=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800))

    now = datetime.utcnow()
    access_token_expires_at = now + access_token_expires
    refresh_token_expires_at = now + refresh_token_expires

    payload = {
        'sub': user.id,
        'email': user.email,
        'role': user.role,
        'exp': access_token_expires_at,
        'iat': now,
        'type': 'access'
    }
    if include_mfa_verified:
        payload['mfa_verified'] = True

    access_token = jwt.encode(
        payload,
        current_app.config.get('JWT_SECRET_KEY'),
        algorithm='HS256'
    )

    refresh_token = secrets.token_urlsafe(64)

    token = Token.create(
        usuario_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_token_expires_at,
        refresh_token_expires_at=refresh_token_expires_at
    )
    token_repository.save(token)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': int(access_token_expires.total_seconds()),
        'usuario': {
            'id': user.id,
            'nombre': user.nombre,
            'email': user.email,
            'usuario': user.usuario,
            'role': user.role,
            'status': user.status,
        }
    }


class AuthenticateUseCase:
    def __init__(self, usuario_repository: UsuarioRepository, token_repository: TokenRepository):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository

    def execute(self, identifier: str, contrasena: str) -> Optional[Dict[str, Any]]:
        normalized_identifier = identifier.strip()
        user = self.usuario_repository.find_by_email(normalized_identifier)

        if not user:
            user = self.usuario_repository.find_by_usuario(normalized_identifier)

        if not user:
            return None
        
        if not bcrypt.checkpw(contrasena.encode('utf-8'), user.contrasena.encode('utf-8')):
            return None
        
        return issue_tokens_for_user(user, self.token_repository)


class RefreshTokenUseCase:
    def __init__(self, usuario_repository: UsuarioRepository, token_repository: TokenRepository):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository

    def execute(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        token = self.token_repository.find_by_refresh_token(refresh_token)
        if not token:
            return None
        
        if token.refresh_token_expires_at < datetime.utcnow():
            self.token_repository.revoke(token.id)
            return None
        
        user = self.usuario_repository.find_by_id(token.usuario_id)
        if not user:
            return None
        
        self.token_repository.revoke(token.id)
        
        return issue_tokens_for_user(user, self.token_repository)


class GetUsuarioByTokenUseCase:
    def __init__(self, usuario_repository: UsuarioRepository, token_repository: TokenRepository):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository

    def execute(self, access_token: str) -> Optional[Usuario]:
        try:
            payload = jwt.decode(
                access_token,
                current_app.config.get('JWT_SECRET_KEY'),
                algorithms=['HS256']
            )
            
            token = self.token_repository.find_by_access_token(access_token)
            if not token or token.revocado:
                return None
            
            if token.access_token_expires_at < datetime.utcnow():
                return None
            
            user = self.usuario_repository.find_by_id(payload['sub'])
            return user
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class RevokeTokenUseCase:
    def __init__(self, token_repository: TokenRepository):
        self.token_repository = token_repository

    def execute(self, access_token: str) -> bool:
        token = self.token_repository.find_by_access_token(access_token)
        if token:
            return self.token_repository.revoke(token.id)
        return False
