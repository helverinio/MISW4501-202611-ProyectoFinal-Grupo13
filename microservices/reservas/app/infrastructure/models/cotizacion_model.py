from datetime import datetime, timedelta
from app import db


class CotizacionModel(db.Model):
    __tablename__ = 'cotizaciones'

    id = db.Column(db.String(36), primary_key=True)
    id_usuario = db.Column(db.String(36), nullable=False)
    id_habitacion = db.Column(db.String(36), db.ForeignKey('habitaciones.id'), nullable=False)
    fecha_ingreso = db.Column(db.Date, nullable=False)
    fecha_salida = db.Column(db.Date, nullable=False)
    nro_personas = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Float, nullable=False)
    moneda = db.Column(db.String(3), nullable=False, default='USD')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(minutes=30))

    detalles = db.relationship('CotizacionDetalleModel', backref='cotizacion', lazy=True, cascade='all, delete-orphan')
