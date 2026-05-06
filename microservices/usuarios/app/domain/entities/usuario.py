from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class Usuario:
    id: str
    nombre: str
    email: str
    usuario: str
    contrasena: str
    creado_en: datetime
    ciudad_id: int | None = None
    role: str = 'VIAJERO'
    status: str = 'ACTIVE'
    mfa_secret_encrypted: str | None = None
    mfa_enabled: bool = False
    mfa_confirmed_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    updated_at: datetime | None = None

    @staticmethod
    def create(
        nombre: str,
        email: str,
        contrasena: str,
        usuario: str | None = None,
        ciudad_id: int | None = None,
        role: str = 'VIAJERO',
        status: str = 'ACTIVE',
        mfa_secret_encrypted: str | None = None,
        mfa_enabled: bool = False,
        mfa_confirmed_at: datetime | None = None,
    ) -> 'Usuario':
        now = datetime.utcnow()
        return Usuario(
            id=str(uuid.uuid4()),
            nombre=nombre,
            email=email,
            usuario=usuario or email,
            ciudad_id=ciudad_id,
            contrasena=contrasena,
            role=role,
            status=status,
            mfa_secret_encrypted=mfa_secret_encrypted,
            mfa_enabled=mfa_enabled,
            mfa_confirmed_at=mfa_confirmed_at,
            creado_en=now,
            updated_at=now,
        )
