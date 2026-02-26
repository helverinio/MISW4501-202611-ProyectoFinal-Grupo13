from dataclasses import dataclass
import uuid


@dataclass
class Ciudad:
    id: str
    nombre: str
    id_pais: str

    @staticmethod
    def create(nombre: str, id_pais: str) -> 'Ciudad':
        return Ciudad(
            id=str(uuid.uuid4()),
            nombre=nombre,
            id_pais=id_pais
        )
