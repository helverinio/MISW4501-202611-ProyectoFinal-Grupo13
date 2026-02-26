from dataclasses import dataclass
from typing import Optional
import uuid


@dataclass
class Tarifa:
    id: str
    nombre: str
    valor: float
    descuento: float
    id_habitacion: str

    @staticmethod
    def create(nombre: str, valor: float, descuento: float, 
               id_habitacion: str) -> 'Tarifa':
        return Tarifa(
            id=str(uuid.uuid4()),
            nombre=nombre,
            valor=valor,
            descuento=descuento,
            id_habitacion=id_habitacion
        )
