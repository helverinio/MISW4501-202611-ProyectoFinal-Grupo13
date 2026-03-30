from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.usuario import Usuario


class UsuarioRepository(ABC):
    @abstractmethod
    def save(self, usuario: Usuario) -> Usuario:
        pass

    @abstractmethod
    def find_by_id(self, usuario_id: str) -> Optional[Usuario]:
        pass

    @abstractmethod
    def find_by_usuario(self, usuario: str) -> Optional[Usuario]:
        pass

    @abstractmethod
    def find_by_email(self, email: str) -> Optional[Usuario]:
        pass

    @abstractmethod
    def find_all(self) -> List[Usuario]:
        pass

    @abstractmethod
    def update(self, usuario: Usuario) -> Usuario:
        pass

    @abstractmethod
    def delete(self, usuario_id: str) -> bool:
        pass
