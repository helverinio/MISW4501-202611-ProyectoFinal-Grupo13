from app import db


class TemporadaDetalleModel(db.Model):
    __tablename__ = 'temporadas_detalle'

    id = db.Column(db.String(36), primary_key=True)
    id_temporada = db.Column(db.String(36), db.ForeignKey('temporadas.id'), nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
