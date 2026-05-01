from __future__ import annotations

from typing import List, Optional
import bcrypt
from app.domain.entities.usuario import Usuario
from app.domain.repositories.usuario_repository import UsuarioRepository


class CreateUsuarioUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(
        self,
        nombre: str,
        email: str,
        contrasena_or_usuario: str | None = None,
        contrasena: str | None = None,
        usuario: str | None = None,
        ciudad_id: int | None = None,
        status: str = 'ACTIVE',
    ) -> Usuario:
        if contrasena is None and contrasena_or_usuario is None:
            raise ValueError('contrasena is required')

        if contrasena is None:
            resolved_contrasena = contrasena_or_usuario
            resolved_usuario = usuario
        else:
            resolved_contrasena = contrasena
            resolved_usuario = usuario or contrasena_or_usuario

        hashed_password = bcrypt.hashpw(resolved_contrasena.encode('utf-8'), bcrypt.gensalt())
        user = Usuario.create(
            nombre=nombre,
            email=email,
            usuario=resolved_usuario,
            ciudad_id=ciudad_id,
            contrasena=hashed_password.decode('utf-8'),
            status=status,
        )
        return self.repository.save(user)


class GetUsuarioUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, usuario_id: str) -> Optional[Usuario]:
        return self.repository.find_by_id(usuario_id)


class GetUsuarioByUsuarioUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, usuario: str) -> Optional[Usuario]:
        return self.repository.find_by_usuario(usuario)


class GetAllUsuariosUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self) -> List[Usuario]:
        return self.repository.find_all()


class UpdateUsuarioUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, usuario_id: str, **kwargs) -> Optional[Usuario]:
        user = self.repository.find_by_id(usuario_id)
        if not user:
            return None
        if 'nombre' in kwargs:
            user.nombre = kwargs['nombre']
        if 'email' in kwargs:
            user.email = kwargs['email']
        if 'usuario' in kwargs:
            user.usuario = kwargs['usuario']
        if 'ciudad_id' in kwargs:
            user.ciudad_id = kwargs['ciudad_id']
        if 'contrasena' in kwargs:
            hashed_password = bcrypt.hashpw(kwargs['contrasena'].encode('utf-8'), bcrypt.gensalt())
            user.contrasena = hashed_password.decode('utf-8')
        return self.repository.update(user)


class DeleteUsuarioUseCase:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, usuario_id: str) -> bool:
        return self.repository.delete(usuario_id)
