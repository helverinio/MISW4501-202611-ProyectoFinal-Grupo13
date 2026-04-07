from datetime import datetime
from app import db


class TipoHabitacionModel(db.Model):
    __tablename__ = 'tipos_habitacion'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    capacidad = db.Column(db.Integer, nullable=False)
    camas = db.Column(db.Integer, nullable=False)
    id_hotel = db.Column(db.String(36), db.ForeignKey('hoteles.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    habitaciones = db.relationship('HabitacionModel', backref='tipo_habitacion', lazy=True)
    planes_tarifarios = db.relationship('PlanTarifarioModel', backref='tipo_habitacion', lazy=True)
