from app import db


class PagoModel(db.Model):
    __tablename__ = 'pagos'

    id = db.Column(db.String(36), primary_key=True)
    fecha_pago = db.Column(db.DateTime, nullable=False)
    total = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(50), nullable=False)
    id_pais = db.Column(db.String(36), db.ForeignKey('paises.id'), nullable=False)
    id_reserva = db.Column(db.String(36), db.ForeignKey('reservas.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'fecha_pago': self.fecha_pago.isoformat() if self.fecha_pago else None,
            'total': self.total,
            'estado': self.estado,
            'id_pais': self.id_pais,
            'id_reserva': self.id_reserva
        }
