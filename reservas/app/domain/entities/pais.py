from dataclasses import dataclass
import uuid


@dataclass
class Pais:
    id: str
    nombre: str

    @staticmethod
    def create(nombre: str) -> 'Pais':
        return Pais(
            id=str(uuid.uuid4()),
            nombre=nombre
        )
