from app import db


class ReservaModel(db.Model):
    __tablename__ = 'reservas'

    id = db.Column(db.String(36), primary_key=True)
    fecha_ingreso = db.Column(db.DateTime, nullable=False)
    fecha_salida = db.Column(db.DateTime, nullable=False)
    total = db.Column(db.Float, nullable=False)
    nro_personas = db.Column(db.Integer, nullable=False)
    id_usuario = db.Column(db.String(36), nullable=False)
    id_pais = db.Column(db.String(36), db.ForeignKey('paises.id'), nullable=False)
    id_habitacion = db.Column(db.String(36), db.ForeignKey('habitaciones.id'), nullable=False)
    id_estado = db.Column(db.String(36), db.ForeignKey('estados.id'), nullable=False)
    id_cotizacion = db.Column(db.String(36), db.ForeignKey('cotizaciones.id'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=True, server_default=db.func.now())

    pagos = db.relationship('PagoModel', backref='reserva', lazy=True)
    notificaciones = db.relationship('NotificacionModel', backref='reserva', lazy=True)
    detalle_tarifa = db.relationship('ReservaDetalleTarifaModel', backref='reserva', lazy=True, cascade='all, delete-orphan')
    comentarios_hoteles = db.relationship('ComentarioHotelModel', backref='reserva', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'fecha_ingreso': self.fecha_ingreso.isoformat() if self.fecha_ingreso else None,
            'fecha_salida': self.fecha_salida.isoformat() if self.fecha_salida else None,
            'total': self.total,
            'nro_personas': self.nro_personas,
            'id_usuario': self.id_usuario,
            'id_pais': self.id_pais,
            'id_habitacion': self.id_habitacion,
            'id_estado': self.id_estado,
            'id_cotizacion': self.id_cotizacion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
