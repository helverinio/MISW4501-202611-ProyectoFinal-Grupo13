from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class Token:
    id: str
    usuario_id: str
    access_token: str
    refresh_token: str
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime
    creado_en: datetime
    revocado: bool

    @staticmethod
    def create(usuario_id: str, access_token: str, refresh_token: str,
               access_token_expires_at: datetime, refresh_token_expires_at: datetime) -> 'Token':
        return Token(
            id=str(uuid.uuid4()),
            usuario_id=usuario_id,
            access_token=access_token,
            refresh_token=refresh_token,
            access_token_expires_at=access_token_expires_at,
            refresh_token_expires_at=refresh_token_expires_at,
            creado_en=datetime.utcnow(),
            revocado=False
        )
