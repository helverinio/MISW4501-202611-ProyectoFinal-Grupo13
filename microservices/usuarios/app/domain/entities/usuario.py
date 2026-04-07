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

    @staticmethod
    def create(
        nombre: str,
        email: str,
        contrasena: str,
        usuario: str | None = None,
        ciudad_id: int | None = None
    ) -> 'Usuario':
        return Usuario(
            id=str(uuid.uuid4()),
            nombre=nombre,
            email=email,
            usuario=usuario or email,
            ciudad_id=ciudad_id,
            contrasena=contrasena,
            creado_en=datetime.utcnow()
        )
