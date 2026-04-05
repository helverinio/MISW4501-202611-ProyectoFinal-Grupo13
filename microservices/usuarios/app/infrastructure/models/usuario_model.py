from app import db


class PaisModel(db.Model):
    __tablename__ = 'pais'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=False)


class CiudadModel(db.Model):
    __tablename__ = 'ciudad'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=False)
    pais_id = db.Column(db.Integer, db.ForeignKey('pais.id'), nullable=False)

    pais = db.relationship('PaisModel', backref='ciudades', lazy=True)


class UsuarioModel(db.Model):
    __tablename__ = 'user_accounts'

    id = db.Column(db.String(36), primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    usuario = db.Column(db.String(100), nullable=False, unique=True)
    ciudad_id = db.Column(db.Integer, db.ForeignKey('ciudad.id'), nullable=True)
    contrasena = db.Column(db.String(255), nullable=False)
    creado_en = db.Column(db.DateTime, nullable=False)

    ciudad = db.relationship('CiudadModel', backref='usuarios', lazy=True)
    tokens = db.relationship('TokenModel', backref='usuario', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'usuario': self.usuario,
            'ciudad_id': self.ciudad_id,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None
        }
