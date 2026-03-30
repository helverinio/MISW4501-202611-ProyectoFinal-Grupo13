from app import db


class TokenModel(db.Model):
    __tablename__ = 'tokens'

    id = db.Column(db.String(36), primary_key=True)
    usuario_id = db.Column(db.String(36), db.ForeignKey('user_accounts.id'), nullable=False)
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=False)
    access_token_expires_at = db.Column(db.DateTime, nullable=False)
    refresh_token_expires_at = db.Column(db.DateTime, nullable=False)
    creado_en = db.Column(db.DateTime, nullable=False)
    revocado = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'access_token_expires_at': self.access_token_expires_at.isoformat() if self.access_token_expires_at else None,
            'refresh_token_expires_at': self.refresh_token_expires_at.isoformat() if self.refresh_token_expires_at else None,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'revocado': self.revocado
        }
