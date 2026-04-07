from app import db


class TemporadaModel(db.Model):
    __tablename__ = 'temporadas'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    activo = db.Column(db.Boolean, nullable=False, default=True)

    detalles = db.relationship('TemporadaDetalleModel', backref='temporada', lazy=True)
    reglas_tarifarias = db.relationship('ReglaTarifariaModel', backref='temporada', lazy=True)
