from datetime import datetime, timedelta

import pytest

from app import db
from app.domain.entities.token import Token
from app.domain.entities.usuario import Usuario
from app.infrastructure.models.token_model import TokenModel
from app.infrastructure.models.usuario_model import UsuarioModel
from app.infrastructure.repositories.sqlalchemy_token_repository import SQLAlchemyTokenRepository
from app.infrastructure.repositories.sqlalchemy_usuario_repository import SQLAlchemyUsuarioRepository


@pytest.fixture
def db_app():
    from flask import Flask

    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
        try:
            yield app
        finally:
            db.session.remove()
            db.drop_all()


def _usuario_entity(user_id="u-1", usuario="ana", email="ana@example.com"):
    return Usuario(
        id=user_id,
        nombre="Ana",
        email=email,
        usuario=usuario,
        contrasena="hashed",
        creado_en=datetime(2026, 1, 1, 0, 0, 0),
    )


def _token_entity(token_id="t-1", usuario_id="u-1", access_token="acc-1", refresh_token="ref-1"):
    return Token(
        id=token_id,
        usuario_id=usuario_id,
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=datetime.utcnow() + timedelta(minutes=10),
        refresh_token_expires_at=datetime.utcnow() + timedelta(minutes=20),
        creado_en=datetime.utcnow(),
        revocado=False,
    )


def test_usuario_model_to_dict_returns_serializable_data(db_app):
    model = UsuarioModel(
        id="u-1",
        nombre="Ana",
        email="ana@example.com",
        usuario="ana",
        contrasena="hashed",
        creado_en=datetime(2026, 1, 1, 0, 0, 0),
    )

    data = model.to_dict()

    assert data["id"] == "u-1"
    assert data["usuario"] == "ana"
    assert data["creado_en"] == "2026-01-01T00:00:00"


def test_token_model_to_dict_returns_serializable_data(db_app):
    model = TokenModel(
        id="t-1",
        usuario_id="u-1",
        access_token="acc",
        refresh_token="ref",
        access_token_expires_at=datetime(2026, 1, 1, 0, 10, 0),
        refresh_token_expires_at=datetime(2026, 1, 1, 0, 20, 0),
        creado_en=datetime(2026, 1, 1, 0, 0, 0),
        revocado=False,
    )

    data = model.to_dict()

    assert data["id"] == "t-1"
    assert data["usuario_id"] == "u-1"
    assert data["revocado"] is False


def test_sqlalchemy_usuario_repository_crud(db_app):
    repo = SQLAlchemyUsuarioRepository()
    user = _usuario_entity()

    saved = repo.save(user)
    by_id = repo.find_by_id(user.id)
    by_usuario = repo.find_by_usuario("ana")
    by_email = repo.find_by_email("ana@example.com")

    assert saved.id == user.id
    assert by_id is not None and by_id.usuario == "ana"
    assert by_usuario is not None and by_usuario.email == "ana@example.com"
    assert by_email is not None and by_email.id == "u-1"

    user.nombre = "Ana Actualizada"
    user.email = "ana2@example.com"
    user.usuario = "ana2"
    repo.update(user)

    updated = repo.find_by_id(user.id)
    assert updated is not None and updated.nombre == "Ana Actualizada"

    assert len(repo.find_all()) == 1
    assert repo.delete(user.id) is True
    assert repo.delete(user.id) is False
    assert repo.find_by_id(user.id) is None


def test_sqlalchemy_token_repository_main_operations(db_app):
    user_repo = SQLAlchemyUsuarioRepository()
    token_repo = SQLAlchemyTokenRepository()

    user = _usuario_entity()
    user_repo.save(user)

    token = _token_entity(usuario_id=user.id)
    token_repo.save(token)

    by_id = token_repo.find_by_id(token.id)
    by_access = token_repo.find_by_access_token(token.access_token)
    by_refresh = token_repo.find_by_refresh_token(token.refresh_token)
    by_user = token_repo.find_by_usuario_id(user.id)

    assert by_id is not None and by_id.id == token.id
    assert by_access is not None and by_access.usuario_id == user.id
    assert by_refresh is not None and by_refresh.id == token.id
    assert len(by_user) == 1

    assert token_repo.revoke(token.id) is True
    assert token_repo.find_by_access_token(token.access_token) is None
    assert token_repo.revoke("missing") is False


def test_sqlalchemy_token_repository_revoke_all_and_delete_expired(db_app):
    user_repo = SQLAlchemyUsuarioRepository()
    token_repo = SQLAlchemyTokenRepository()

    user = _usuario_entity(user_id="u-2", usuario="pepe", email="pepe@example.com")
    user_repo.save(user)

    valid_token = _token_entity(token_id="t-valid", usuario_id=user.id, access_token="acc-v", refresh_token="ref-v")
    expired_token = Token(
        id="t-exp",
        usuario_id=user.id,
        access_token="acc-e",
        refresh_token="ref-e",
        access_token_expires_at=datetime.utcnow() - timedelta(hours=2),
        refresh_token_expires_at=datetime.utcnow() - timedelta(hours=1),
        creado_en=datetime.utcnow(),
        revocado=False,
    )

    token_repo.save(valid_token)
    token_repo.save(expired_token)

    assert token_repo.revoke_all_by_usuario(user.id) is True
    assert token_repo.find_by_usuario_id(user.id) == []

    deleted_count = token_repo.delete_expired()

    assert deleted_count >= 1
