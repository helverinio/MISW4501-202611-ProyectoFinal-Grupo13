from datetime import datetime, timedelta

import bcrypt
import jwt
import pytest

from app.application.use_cases.auth_use_cases import (
    AuthenticateUseCase,
    GetUsuarioByTokenUseCase,
    RefreshTokenUseCase,
    RevokeTokenUseCase,
)
from app.application.use_cases.usuario_use_cases import (
    CreateUsuarioUseCase,
    DeleteUsuarioUseCase,
    GetAllUsuariosUseCase,
    GetUsuarioByUsuarioUseCase,
    GetUsuarioUseCase,
    UpdateUsuarioUseCase,
)
from app.domain.entities.token import Token
from app.domain.entities.usuario import Usuario


class InMemoryUsuarioRepository:
    def __init__(self):
        self.data = {}

    def save(self, usuario):
        self.data[usuario.id] = usuario
        return usuario

    def find_by_id(self, usuario_id):
        return self.data.get(usuario_id)

    def find_by_usuario(self, usuario):
        for user in self.data.values():
            if user.usuario == usuario:
                return user
        return None

    def find_by_email(self, email):
        for user in self.data.values():
            if user.email == email:
                return user
        return None

    def find_all(self):
        return list(self.data.values())

    def update(self, usuario):
        self.data[usuario.id] = usuario
        return usuario

    def delete(self, usuario_id):
        return self.data.pop(usuario_id, None) is not None


class InMemoryTokenRepository:
    def __init__(self):
        self.data = {}
        self.revoked_ids = []

    def save(self, token):
        self.data[token.id] = token
        return token

    def find_by_id(self, token_id):
        return self.data.get(token_id)

    def find_by_access_token(self, access_token):
        for token in self.data.values():
            if token.access_token == access_token and not token.revocado:
                return token
        return None

    def find_by_refresh_token(self, refresh_token):
        for token in self.data.values():
            if token.refresh_token == refresh_token and not token.revocado:
                return token
        return None

    def find_by_usuario_id(self, usuario_id):
        return [t for t in self.data.values() if t.usuario_id == usuario_id and not t.revocado]

    def revoke(self, token_id):
        token = self.data.get(token_id)
        if not token:
            return False
        token.revocado = True
        self.revoked_ids.append(token_id)
        return True

    def revoke_all_by_usuario(self, usuario_id):
        found = False
        for token in self.data.values():
            if token.usuario_id == usuario_id:
                token.revocado = True
                found = True
        return found

    def delete_expired(self):
        now = datetime.utcnow()
        expired_ids = [tid for tid, token in self.data.items() if token.refresh_token_expires_at < now]
        for token_id in expired_ids:
            del self.data[token_id]
        return len(expired_ids)


@pytest.fixture
def flask_app_context():
    import app as app_module

    class TestConfig:
        TESTING = True
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        JWT_SECRET_KEY = "jwt-test-secret"
        JWT_ACCESS_TOKEN_EXPIRES = 120
        JWT_REFRESH_TOKEN_EXPIRES = 240

    app_module.config["default"] = TestConfig
    app = app_module.create_app("default")
    with app.app_context():
        yield app


def _plain_user(usuario="ana", user_id="u-1", password="secret"):
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return Usuario(
        id=user_id,
        nombre="Ana",
        email=f"{usuario}@example.com",
        usuario=usuario,
        contrasena=hashed,
        creado_en=datetime(2026, 1, 1, 0, 0, 0),
    )


def test_create_usuario_use_case_hashes_password():
    repo = InMemoryUsuarioRepository()
    use_case = CreateUsuarioUseCase(repo)

    created = use_case.execute("Ana", "ana@example.com", "ana", "secret")

    assert created.id is not None
    assert created.contrasena != "secret"
    assert bcrypt.checkpw("secret".encode("utf-8"), created.contrasena.encode("utf-8"))


def test_get_usuario_use_case_returns_user_if_found():
    repo = InMemoryUsuarioRepository()
    user = _plain_user()
    repo.save(user)

    use_case = GetUsuarioUseCase(repo)

    assert use_case.execute(user.id) == user


def test_get_usuario_by_usuario_use_case_returns_user_if_found():
    repo = InMemoryUsuarioRepository()
    user = _plain_user(usuario="pepe")
    repo.save(user)

    use_case = GetUsuarioByUsuarioUseCase(repo)

    assert use_case.execute("pepe") == user


def test_get_all_usuarios_use_case_returns_all_users():
    repo = InMemoryUsuarioRepository()
    repo.save(_plain_user(user_id="u-1", usuario="ana"))
    repo.save(_plain_user(user_id="u-2", usuario="pepe"))

    use_case = GetAllUsuariosUseCase(repo)

    assert len(use_case.execute()) == 2


def test_update_usuario_use_case_returns_none_when_user_does_not_exist():
    repo = InMemoryUsuarioRepository()
    use_case = UpdateUsuarioUseCase(repo)

    updated = use_case.execute("missing", nombre="Nuevo")

    assert updated is None


def test_update_usuario_use_case_updates_fields_and_hashes_password():
    repo = InMemoryUsuarioRepository()
    existing = _plain_user(password="initial")
    repo.save(existing)

    use_case = UpdateUsuarioUseCase(repo)
    updated = use_case.execute(existing.id, nombre="Nuevo", contrasena="new-secret")

    assert updated.nombre == "Nuevo"
    assert bcrypt.checkpw("new-secret".encode("utf-8"), updated.contrasena.encode("utf-8"))


def test_delete_usuario_use_case_deletes_existing_user():
    repo = InMemoryUsuarioRepository()
    existing = _plain_user()
    repo.save(existing)

    use_case = DeleteUsuarioUseCase(repo)

    assert use_case.execute(existing.id) is True
    assert repo.find_by_id(existing.id) is None


def test_authenticate_use_case_returns_none_for_unknown_user(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()

    use_case = AuthenticateUseCase(user_repo, token_repo)

    assert use_case.execute("unknown", "secret") is None


def test_authenticate_use_case_returns_none_for_invalid_password(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user_repo.save(_plain_user(usuario="ana", password="right"))

    use_case = AuthenticateUseCase(user_repo, token_repo)

    assert use_case.execute("ana", "wrong") is None


def test_authenticate_use_case_returns_tokens_and_persists_token(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user_repo.save(_plain_user(usuario="ana", password="secret"))

    use_case = AuthenticateUseCase(user_repo, token_repo)
    result = use_case.execute("ana", "secret")

    assert result is not None
    assert result["token_type"] == "Bearer"
    assert len(token_repo.data) == 1


def test_refresh_token_use_case_returns_none_when_token_not_found(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()

    use_case = RefreshTokenUseCase(user_repo, token_repo)

    assert use_case.execute("missing") is None


def test_refresh_token_use_case_revokes_and_returns_none_for_expired_token(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user = _plain_user(usuario="ana")
    user_repo.save(user)
    expired = Token.create(
        usuario_id=user.id,
        access_token="acc-exp",
        refresh_token="ref-exp",
        access_token_expires_at=datetime.utcnow() - timedelta(hours=2),
        refresh_token_expires_at=datetime.utcnow() - timedelta(hours=1),
    )
    token_repo.save(expired)

    use_case = RefreshTokenUseCase(user_repo, token_repo)

    assert use_case.execute("ref-exp") is None
    assert expired.id in token_repo.revoked_ids


def test_refresh_token_use_case_returns_none_when_user_not_found(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()

    orphan_token = Token.create(
        usuario_id="missing-user",
        access_token="acc",
        refresh_token="ref",
        access_token_expires_at=datetime.utcnow() + timedelta(hours=1),
        refresh_token_expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    token_repo.save(orphan_token)

    use_case = RefreshTokenUseCase(user_repo, token_repo)

    assert use_case.execute("ref") is None


def test_refresh_token_use_case_rotates_token_when_valid(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user = _plain_user(usuario="ana")
    user_repo.save(user)

    current = Token.create(
        usuario_id=user.id,
        access_token="acc-old",
        refresh_token="ref-old",
        access_token_expires_at=datetime.utcnow() + timedelta(hours=1),
        refresh_token_expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    token_repo.save(current)

    use_case = RefreshTokenUseCase(user_repo, token_repo)
    result = use_case.execute("ref-old")

    assert result is not None
    assert current.id in token_repo.revoked_ids
    assert len(token_repo.data) >= 2


def test_get_usuario_by_token_use_case_returns_none_for_invalid_token(flask_app_context):
    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()

    use_case = GetUsuarioByTokenUseCase(user_repo, token_repo)

    assert use_case.execute("not-a-jwt") is None


def test_get_usuario_by_token_use_case_returns_none_for_revoked_token(flask_app_context):
    from flask import current_app

    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user = _plain_user(usuario="ana")
    user_repo.save(user)

    access_token = jwt.encode(
        {
            "sub": user.id,
            "usuario": user.usuario,
            "exp": datetime.utcnow() + timedelta(minutes=10),
            "iat": datetime.utcnow(),
            "type": "access",
        },
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )

    token = Token.create(
        usuario_id=user.id,
        access_token=access_token,
        refresh_token="ref",
        access_token_expires_at=datetime.utcnow() + timedelta(minutes=10),
        refresh_token_expires_at=datetime.utcnow() + timedelta(minutes=20),
    )
    token.revocado = True
    token_repo.save(token)

    use_case = GetUsuarioByTokenUseCase(user_repo, token_repo)

    assert use_case.execute(access_token) is None


def test_get_usuario_by_token_use_case_returns_none_for_expired_access_token(flask_app_context):
    from flask import current_app

    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user = _plain_user(usuario="ana")
    user_repo.save(user)

    access_token = jwt.encode(
        {
            "sub": user.id,
            "usuario": user.usuario,
            "exp": datetime.utcnow() - timedelta(minutes=1),
            "iat": datetime.utcnow() - timedelta(minutes=2),
            "type": "access",
        },
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )

    token = Token.create(
        usuario_id=user.id,
        access_token=access_token,
        refresh_token="ref",
        access_token_expires_at=datetime.utcnow() - timedelta(minutes=1),
        refresh_token_expires_at=datetime.utcnow() + timedelta(minutes=20),
    )
    token_repo.save(token)

    use_case = GetUsuarioByTokenUseCase(user_repo, token_repo)

    assert use_case.execute(access_token) is None


def test_get_usuario_by_token_use_case_returns_user_when_valid(flask_app_context):
    from flask import current_app

    user_repo = InMemoryUsuarioRepository()
    token_repo = InMemoryTokenRepository()
    user = _plain_user(usuario="ana")
    user_repo.save(user)

    access_token = jwt.encode(
        {
            "sub": user.id,
            "usuario": user.usuario,
            "exp": datetime.utcnow() + timedelta(minutes=10),
            "iat": datetime.utcnow(),
            "type": "access",
        },
        current_app.config["JWT_SECRET_KEY"],
        algorithm="HS256",
    )

    token = Token.create(
        usuario_id=user.id,
        access_token=access_token,
        refresh_token="ref",
        access_token_expires_at=datetime.utcnow() + timedelta(minutes=10),
        refresh_token_expires_at=datetime.utcnow() + timedelta(minutes=20),
    )
    token_repo.save(token)

    use_case = GetUsuarioByTokenUseCase(user_repo, token_repo)

    assert use_case.execute(access_token).id == user.id


def test_revoke_token_use_case_returns_false_when_token_not_found():
    token_repo = InMemoryTokenRepository()
    use_case = RevokeTokenUseCase(token_repo)

    assert use_case.execute("missing") is False


def test_revoke_token_use_case_returns_true_when_token_exists():
    token_repo = InMemoryTokenRepository()
    token = Token.create(
        usuario_id="u-1",
        access_token="acc",
        refresh_token="ref",
        access_token_expires_at=datetime.utcnow() + timedelta(minutes=10),
        refresh_token_expires_at=datetime.utcnow() + timedelta(minutes=20),
    )
    token_repo.save(token)

    use_case = RevokeTokenUseCase(token_repo)

    assert use_case.execute("acc") is True
