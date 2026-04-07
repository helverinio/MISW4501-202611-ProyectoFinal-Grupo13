from app import db


class ReservaDetalleTarifaModel(db.Model):
    __tablename__ = 'reserva_detalle_tarifa'

    id = db.Column(db.String(36), primary_key=True)
    id_reserva = db.Column(db.String(36), db.ForeignKey('reservas.id'), nullable=False)
    fecha_noche = db.Column(db.Date, nullable=False)
    id_plan_tarifario = db.Column(db.String(36), db.ForeignKey('planes_tarifarios.id'), nullable=False)
    id_regla_tarifaria = db.Column(db.String(36), db.ForeignKey('reglas_tarifarias.id'), nullable=False)
    precio_noche = db.Column(db.Float, nullable=False)
    subtotal_noche = db.Column(db.Float, nullable=False)
