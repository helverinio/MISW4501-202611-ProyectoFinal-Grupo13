from app import db


class CotizacionDetalleModel(db.Model):
    __tablename__ = 'cotizacion_detalle'

    id = db.Column(db.String(36), primary_key=True)
    id_cotizacion = db.Column(db.String(36), db.ForeignKey('cotizaciones.id'), nullable=False)
    fecha_noche = db.Column(db.Date, nullable=False)
    id_plan_tarifario = db.Column(db.String(36), db.ForeignKey('planes_tarifarios.id'), nullable=False)
    id_regla_tarifaria = db.Column(db.String(36), db.ForeignKey('reglas_tarifarias.id'), nullable=False)
    precio_noche = db.Column(db.Float, nullable=False)
    subtotal_noche = db.Column(db.Float, nullable=False)
