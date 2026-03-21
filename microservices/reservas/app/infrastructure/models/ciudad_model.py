from app import db


class CiudadModel(db.Model):
    __tablename__ = 'ciudades'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    id_pais = db.Column(db.String(36), db.ForeignKey('paises.id'), nullable=False)

    hoteles = db.relationship('HotelModel', backref='ciudad', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'id_pais': self.id_pais
        }
