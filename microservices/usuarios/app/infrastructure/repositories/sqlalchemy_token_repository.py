from typing import List, Optional
from datetime import datetime
from app import db
from app.domain.entities.token import Token
from app.domain.repositories.token_repository import TokenRepository
from app.infrastructure.models.token_model import TokenModel


class SQLAlchemyTokenRepository(TokenRepository):
    def save(self, token: Token) -> Token:
        model = TokenModel(
            id=token.id,
            usuario_id=token.usuario_id,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            access_token_expires_at=token.access_token_expires_at,
            refresh_token_expires_at=token.refresh_token_expires_at,
            creado_en=token.creado_en,
            revocado=token.revocado
        )
        db.session.add(model)
        db.session.commit()
        return token

    def find_by_id(self, token_id: str) -> Optional[Token]:
        model = TokenModel.query.get(token_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_by_access_token(self, access_token: str) -> Optional[Token]:
        model = TokenModel.query.filter_by(access_token=access_token, revocado=False).first()
        if not model:
            return None
        return self._to_entity(model)

    def find_by_refresh_token(self, refresh_token: str) -> Optional[Token]:
        model = TokenModel.query.filter_by(refresh_token=refresh_token, revocado=False).first()
        if not model:
            return None
        return self._to_entity(model)

    def find_by_usuario_id(self, usuario_id: str) -> List[Token]:
        models = TokenModel.query.filter_by(usuario_id=usuario_id, revocado=False).all()
        return [self._to_entity(m) for m in models]

    def revoke(self, token_id: str) -> bool:
        model = TokenModel.query.get(token_id)
        if model:
            model.revocado = True
            db.session.commit()
            return True
        return False

    def revoke_all_by_usuario(self, usuario_id: str) -> bool:
        TokenModel.query.filter_by(usuario_id=usuario_id).update({'revocado': True})
        db.session.commit()
        return True

    def delete_expired(self) -> int:
        now = datetime.utcnow()
        result = TokenModel.query.filter(
            TokenModel.refresh_token_expires_at < now
        ).delete()
        db.session.commit()
        return result

    def _to_entity(self, model: TokenModel) -> Token:
        return Token(
            id=model.id,
            usuario_id=model.usuario_id,
            access_token=model.access_token,
            refresh_token=model.refresh_token,
            access_token_expires_at=model.access_token_expires_at,
            refresh_token_expires_at=model.refresh_token_expires_at,
            creado_en=model.creado_en,
            revocado=model.revocado
        )
