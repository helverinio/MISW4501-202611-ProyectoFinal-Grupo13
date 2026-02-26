from app import db


class HotelModel(db.Model):
    __tablename__ = 'hoteles'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    amenidades = db.Column(db.Text, nullable=True)
    id_ciudad = db.Column(db.String(36), db.ForeignKey('ciudades.id'), nullable=False)

    habitaciones = db.relationship('HabitacionModel', backref='hotel', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'descripcion': self.descripcion,
            'amenidades': self.amenidades,
            'id_ciudad': self.id_ciudad
        }
