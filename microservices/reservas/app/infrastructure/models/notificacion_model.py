from app import db


class NotificacionModel(db.Model):
    __tablename__ = 'notificaciones'

    id = db.Column(db.String(36), primary_key=True)
    fecha_notif = db.Column(db.DateTime, nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    id_reserva = db.Column(db.String(36), db.ForeignKey('reservas.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'fecha_notif': self.fecha_notif.isoformat() if self.fecha_notif else None,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'id_reserva': self.id_reserva
        }
