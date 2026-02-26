from app import db


class PaisModel(db.Model):
    __tablename__ = 'paises'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)

    ciudades = db.relationship('CiudadModel', backref='pais', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }
