from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class Usuario:
    id: str
    nombre: str
    email: str
    contrasena: str
    creado_en: datetime

    @staticmethod
    def create(nombre: str, email: str, contrasena: str) -> 'Usuario':
        return Usuario(
            id=str(uuid.uuid4()),
            nombre=nombre,
            email=email,
            contrasena=contrasena,
            creado_en=datetime.utcnow()
        )
