from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class Estado:
    id: str
    nombre: str
    descripcion: Optional[str]

    @staticmethod
    def create(nombre: str, descripcion: Optional[str] = None) -> 'Estado':
        return Estado(
            id=str(uuid.uuid4()),
            nombre=nombre,
            descripcion=descripcion
        )
