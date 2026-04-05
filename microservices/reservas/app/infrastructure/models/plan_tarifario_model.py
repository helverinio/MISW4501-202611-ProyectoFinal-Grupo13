from app import db


class PlanTarifarioModel(db.Model):
    __tablename__ = 'planes_tarifarios'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    moneda = db.Column(db.String(3), nullable=False, default='USD')
    activo = db.Column(db.Boolean, nullable=False, default=True)
    id_tipo_habitacion = db.Column(db.String(36), db.ForeignKey('tipos_habitacion.id'), nullable=False)

    reglas_tarifarias = db.relationship('ReglaTarifariaModel', backref='plan_tarifario', lazy=True)
