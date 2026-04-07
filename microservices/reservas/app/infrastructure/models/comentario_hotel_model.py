from app import db


class ComentarioHotelModel(db.Model):
    __tablename__ = 'comentarios_hoteles'
    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='chk_comentarios_hoteles_rating_1_5'),
        db.UniqueConstraint('id_usuario', 'id_reserva', name='uq_comentarios_hoteles_usuario_reserva'),
        db.Index('ix_comentarios_hoteles_id_hotel', 'id_hotel'),
        db.Index('ix_comentarios_hoteles_id_hotel_created_at', 'id_hotel', 'created_at'),
    )

    id = db.Column(db.String(36), primary_key=True)
    id_hotel = db.Column(db.String(36), db.ForeignKey('hoteles.id'), nullable=False)
    id_usuario = db.Column(db.String(36), nullable=False)
    id_reserva = db.Column(db.String(36), db.ForeignKey('reservas.id'), nullable=False)
    comentario = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now(), onupdate=db.func.now())
    activo = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'id_hotel': self.id_hotel,
            'id_usuario': self.id_usuario,
            'id_reserva': self.id_reserva,
            'comentario': self.comentario,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'activo': self.activo,
        }
