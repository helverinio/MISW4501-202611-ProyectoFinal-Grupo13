from app import db


class TarifaModel(db.Model):
    __tablename__ = 'tarifas'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    descuento = db.Column(db.Float, nullable=False, default=0.0)
    id_habitacion = db.Column(db.String(36), db.ForeignKey('habitaciones.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'valor': self.valor,
            'descuento': self.descuento,
            'id_habitacion': self.id_habitacion
        }
