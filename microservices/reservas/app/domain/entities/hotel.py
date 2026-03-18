from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class Hotel:
    id: str
    nombre: str
    email: str
    descripcion: Optional[str]
    amenidades: Optional[str]
    id_ciudad: str

    @staticmethod
    def create(nombre: str, email: str, id_ciudad: str, 
               descripcion: Optional[str] = None, 
               amenidades: Optional[str] = None) -> 'Hotel':
        return Hotel(
            id=str(uuid.uuid4()),
            nombre=nombre,
            email=email,
            descripcion=descripcion,
            amenidades=amenidades,
            id_ciudad=id_ciudad
        )
