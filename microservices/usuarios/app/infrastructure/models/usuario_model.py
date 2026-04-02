from app import db


class UsuarioModel(db.Model):
    __tablename__ = 'user_accounts'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    contrasena = db.Column(db.String(255), nullable=False)
    creado_en = db.Column(db.DateTime, nullable=False)

    tokens = db.relationship('TokenModel', backref='usuario', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }
