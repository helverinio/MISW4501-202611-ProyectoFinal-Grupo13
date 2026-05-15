from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class AdminReview:
    """
    Enriched review entity for admin dashboard containing review details
    joined with guest, hotel, and reservation information.
    """
    # Review core fields
    id: str
    rating: int
    comentario: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Hotel details
    id_hotel: str
    nombre_hotel: str
    
    # Guest details (from usuarios table or fallback)
    id_usuario: str
    nombre_usuario: str
    
    # Room details
    nro_habitacion: int
    tipo_habitacion: str
    capacidad: int
    
    # Reservation details
    id_reserva: str
    fecha_ingreso: datetime
    fecha_salida: datetime
    nro_personas: int
    
    # Derived fields
    duracion_noches: int  # Number of nights stayed
    sentimiento: str  # 'positive', 'neutral', or 'negative' derived from rating
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'rating': self.rating,
            'comentario': self.comentario,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'id_hotel': self.id_hotel,
            'nombre_hotel': self.nombre_hotel,
            'id_usuario': self.id_usuario,
            'nombre_usuario': self.nombre_usuario,
            'nro_habitacion': self.nro_habitacion,
            'tipo_habitacion': self.tipo_habitacion,
            'capacidad': self.capacidad,
            'id_reserva': self.id_reserva,
            'fecha_ingreso': self.fecha_ingreso.isoformat() if self.fecha_ingreso else None,
            'fecha_salida': self.fecha_salida.isoformat() if self.fecha_salida else None,
            'nro_personas': self.nro_personas,
            'duracion_noches': self.duracion_noches,
            'sentimiento': self.sentimiento,
        }
    
    @staticmethod
    def from_db_row(row) -> 'AdminReview':
        """Create AdminReview instance from database query result row."""
        # Derive duration in nights
        fecha_ingreso = row.fecha_ingreso
        fecha_salida = row.fecha_salida
        duracion_noches = (fecha_salida - fecha_ingreso).days if fecha_salida and fecha_ingreso else 0
        
        # Derive sentiment from rating (1-2: negative, 3: neutral, 4-5: positive)
        rating = row.rating
        if rating >= 4:
            sentimiento = 'positive'
        elif rating == 3:
            sentimiento = 'neutral'
        else:
            sentimiento = 'negative'
        
        # Use fallback names if user/hotel service not available
        nombre_usuario = row.nombre_usuario or f"Usuario {row.id_usuario[:8]}"
        nombre_hotel = row.nombre_hotel or "Hotel sin nombre"
        
        return AdminReview(
            id=row.id,
            rating=row.rating,
            comentario=row.comentario,
            created_at=row.created_at,
            updated_at=row.updated_at,
            id_hotel=row.id_hotel,
            nombre_hotel=nombre_hotel,
            id_usuario=row.id_usuario,
            nombre_usuario=nombre_usuario,
            nro_habitacion=row.nro_habitacion,
            tipo_habitacion=row.tipo_habitacion,
            capacidad=row.capacidad,
            id_reserva=row.id_reserva,
            fecha_ingreso=row.fecha_ingreso,
            fecha_salida=row.fecha_salida,
            nro_personas=row.nro_personas,
            duracion_noches=duracion_noches,
            sentimiento=sentimiento,
        )
