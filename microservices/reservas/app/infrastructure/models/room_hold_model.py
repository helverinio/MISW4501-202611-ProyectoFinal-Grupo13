from app import db
from datetime import datetime


class RoomHoldModel(db.Model):
    __tablename__ = 'room_holds'

    id = db.Column(db.String(36), primary_key=True)
    id_habitacion = db.Column(db.String(36), db.ForeignKey('habitaciones.id'), nullable=False)
    id_usuario = db.Column(db.String(36), nullable=False)
    fecha_ingreso = db.Column(db.DateTime, nullable=False)
    fecha_salida = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    __table_args__ = (
        db.Index('ix_room_holds_habitacion_dates', 'id_habitacion', 'fecha_ingreso', 'fecha_salida'),
        db.Index('ix_room_holds_expires_at', 'expires_at'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'id_habitacion': self.id_habitacion,
            'id_usuario': self.id_usuario,
            'fecha_ingreso': self.fecha_ingreso.isoformat(),
            'fecha_salida': self.fecha_salida.isoformat(),
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }
