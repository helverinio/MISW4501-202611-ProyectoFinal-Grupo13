from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.token import Token


class TokenRepository(ABC):
    @abstractmethod
    def save(self, token: Token) -> Token:
        pass

    @abstractmethod
    def find_by_id(self, token_id: str) -> Optional[Token]:
        pass

    @abstractmethod
    def find_by_access_token(self, access_token: str) -> Optional[Token]:
        pass

    @abstractmethod
    def find_by_refresh_token(self, refresh_token: str) -> Optional[Token]:
        pass

    @abstractmethod
    def find_by_usuario_id(self, usuario_id: str) -> List[Token]:
        pass

    @abstractmethod
    def revoke(self, token_id: str) -> bool:
        pass

    @abstractmethod
    def revoke_all_by_usuario(self, usuario_id: str) -> bool:
        pass

    @abstractmethod
    def delete_expired(self) -> int:
        pass
