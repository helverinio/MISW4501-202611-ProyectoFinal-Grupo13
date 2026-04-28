from datetime import datetime
from app import db


class AdminHotelModel(db.Model):
    __tablename__ = 'admin_hoteles'

    id = db.Column(db.String(36), primary_key=True)
    id_usuario = db.Column(db.String(36), nullable=False)
    id_hotel = db.Column(db.String(36), db.ForeignKey('hoteles.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.Index('ix_admin_hoteles_id_usuario', 'id_usuario'),
        db.UniqueConstraint('id_usuario', 'id_hotel', name='uq_admin_hotel'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'id_usuario': self.id_usuario,
            'id_hotel': self.id_hotel,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
