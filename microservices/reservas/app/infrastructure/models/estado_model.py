from app import db


class EstadoModel(db.Model):
    __tablename__ = 'estados'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    reservas = db.relationship('ReservaModel', backref='estado', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion
        }
