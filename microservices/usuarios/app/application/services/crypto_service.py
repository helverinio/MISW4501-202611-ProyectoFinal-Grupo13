from cryptography.fernet import Fernet
from flask import current_app


class CryptoService:
    def __init__(self):
        key = current_app.config.get('MFA_SECRET_ENCRYPTION_KEY')
        self._fernet = Fernet(key.encode('utf-8'))

    def encrypt(self, plain_text: str) -> str:
        return self._fernet.encrypt(plain_text.encode('utf-8')).decode('utf-8')

    def decrypt(self, cipher_text: str) -> str:
        return self._fernet.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
