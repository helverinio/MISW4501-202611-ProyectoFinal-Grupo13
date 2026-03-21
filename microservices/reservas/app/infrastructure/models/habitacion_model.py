from app import db


class HabitacionModel(db.Model):
    __tablename__ = 'habitaciones'

    id = db.Column(db.String(36), primary_key=True)
    tipo = db.Column(db.String(100), nullable=False)
    nro_habitacion = db.Column(db.Integer, nullable=False)
    capacidad = db.Column(db.Integer, nullable=False)
    camas = db.Column(db.Integer, nullable=False)
    id_hotel = db.Column(db.String(36), db.ForeignKey('hoteles.id'), nullable=False)

    tarifas = db.relationship('TarifaModel', backref='habitacion', lazy=True)
    reservas = db.relationship('ReservaModel', backref='habitacion', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'nro_habitacion': self.nro_habitacion,
            'capacidad': self.capacidad,
            'camas': self.camas,
            'id_hotel': self.id_hotel
        }
