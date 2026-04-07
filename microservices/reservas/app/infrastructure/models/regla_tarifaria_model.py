from app import db


class ReglaTarifariaModel(db.Model):
    __tablename__ = 'reglas_tarifarias'

    id = db.Column(db.String(36), primary_key=True)
    id_plan_tarifario = db.Column(db.String(36), db.ForeignKey('planes_tarifarios.id'), nullable=False)
    id_temporada = db.Column(db.String(36), db.ForeignKey('temporadas.id'), nullable=True)
    fecha_inicio = db.Column(db.Date, nullable=True)
    fecha_fin = db.Column(db.Date, nullable=True)
    dias_semana_mask = db.Column(db.String(20), nullable=True)
    precio_base_noche = db.Column(db.Float, nullable=False)
    prioridad = db.Column(db.Integer, nullable=False, default=0)
    min_noches = db.Column(db.Integer, nullable=True)
    combinable = db.Column(db.Boolean, nullable=False, default=False)
    activo = db.Column(db.Boolean, nullable=False, default=True)
