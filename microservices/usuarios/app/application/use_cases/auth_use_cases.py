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


class AuthenticateUseCase:
    def __init__(self, usuario_repository: UsuarioRepository, token_repository: TokenRepository):
        self.usuario_repository = usuario_repository
        self.token_repository = token_repository

    def execute(self, email: str, contrasena: str) -> Optional[Dict[str, Any]]:
        user = self.usuario_repository.find_by_email(email)
        if not user:
            return None
        
        if not bcrypt.checkpw(contrasena.encode('utf-8'), user.contrasena.encode('utf-8')):
            return None
        
        access_token_expires = timedelta(seconds=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
        refresh_token_expires = timedelta(seconds=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800))
        
        now = datetime.utcnow()
        access_token_expires_at = now + access_token_expires
        refresh_token_expires_at = now + refresh_token_expires
        
        access_token = jwt.encode(
            {
                'sub': user.id,
                'email': user.email,
                'exp': access_token_expires_at,
                'iat': now,
                'type': 'access'
            },
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
        self.token_repository.save(token)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(access_token_expires.total_seconds()),
            'usuario': {
                'id': user.id,
                'nombre': user.nombre,
                'email': user.email
            }
        }


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
        
        access_token_expires = timedelta(seconds=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
        refresh_token_expires = timedelta(seconds=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800))
        
        now = datetime.utcnow()
        access_token_expires_at = now + access_token_expires
        refresh_token_expires_at = now + refresh_token_expires
        
        new_access_token = jwt.encode(
            {
                'sub': user.id,
                'email': user.email,
                'exp': access_token_expires_at,
                'iat': now,
                'type': 'access'
            },
            current_app.config.get('JWT_SECRET_KEY'),
            algorithm='HS256'
        )
        
        new_refresh_token = secrets.token_urlsafe(64)
        
        new_token = Token.create(
            usuario_id=user.id,
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            access_token_expires_at=access_token_expires_at,
            refresh_token_expires_at=refresh_token_expires_at
        )
        self.token_repository.save(new_token)
        
        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(access_token_expires.total_seconds()),
            'usuario': {
                'id': user.id,
                'nombre': user.nombre,
                'email': user.email
            }
        }


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
