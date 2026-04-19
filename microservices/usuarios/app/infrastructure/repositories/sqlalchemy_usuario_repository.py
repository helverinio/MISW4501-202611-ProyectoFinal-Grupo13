from typing import List, Optional
from app import db
from app.domain.entities.usuario import Usuario
from app.domain.repositories.usuario_repository import UsuarioRepository
from app.infrastructure.models.usuario_model import UsuarioModel


class SQLAlchemyUsuarioRepository(UsuarioRepository):
    def save(self, usuario: Usuario) -> Usuario:
        model = UsuarioModel(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            usuario=usuario.usuario,
            ciudad_id=usuario.ciudad_id,
            contrasena=usuario.contrasena,
            role=usuario.role,
            status=usuario.status,
            mfa_secret_encrypted=usuario.mfa_secret_encrypted,
            mfa_enabled=usuario.mfa_enabled,
            mfa_confirmed_at=usuario.mfa_confirmed_at,
            failed_login_attempts=usuario.failed_login_attempts,
            locked_until=usuario.locked_until,
            updated_at=usuario.updated_at,
            creado_en=usuario.creado_en
        )
        db.session.add(model)
        db.session.commit()
        return usuario

    def find_by_id(self, usuario_id: str) -> Optional[Usuario]:
        model = UsuarioModel.query.get(usuario_id)
        if not model:
            return None
        return self._to_entity(model)

    def find_by_email(self, email: str) -> Optional[Usuario]:
        model = UsuarioModel.query.filter_by(email=email).first()
        if not model:
            return None
        return self._to_entity(model)

    def find_by_usuario(self, usuario: str) -> Optional[Usuario]:
        model = UsuarioModel.query.filter_by(usuario=usuario).first()
        if not model:
            return None
        return self._to_entity(model)

    def find_all(self) -> List[Usuario]:
        models = UsuarioModel.query.all()
        return [self._to_entity(m) for m in models]

    def update(self, usuario: Usuario) -> Usuario:
        model = UsuarioModel.query.get(usuario.id)
        if model:
            model.nombre = usuario.nombre
            model.email = usuario.email
            model.usuario = usuario.usuario
            model.ciudad_id = usuario.ciudad_id
            model.contrasena = usuario.contrasena
            model.role = usuario.role
            model.status = usuario.status
            model.mfa_secret_encrypted = usuario.mfa_secret_encrypted
            model.mfa_enabled = usuario.mfa_enabled
            model.mfa_confirmed_at = usuario.mfa_confirmed_at
            model.failed_login_attempts = usuario.failed_login_attempts
            model.locked_until = usuario.locked_until
            model.updated_at = usuario.updated_at
            db.session.commit()
        return usuario

    def delete(self, usuario_id: str) -> bool:
        model = UsuarioModel.query.get(usuario_id)
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def _to_entity(self, model: UsuarioModel) -> Usuario:
        return Usuario(
            id=model.id,
            nombre=model.nombre,
            email=model.email,
            usuario=model.usuario,
            ciudad_id=model.ciudad_id,
            contrasena=model.contrasena,
            creado_en=model.creado_en,
            role=model.role,
            status=model.status,
            mfa_secret_encrypted=model.mfa_secret_encrypted,
            mfa_enabled=model.mfa_enabled,
            mfa_confirmed_at=model.mfa_confirmed_at,
            failed_login_attempts=model.failed_login_attempts,
            locked_until=model.locked_until,
            updated_at=model.updated_at,
        )
