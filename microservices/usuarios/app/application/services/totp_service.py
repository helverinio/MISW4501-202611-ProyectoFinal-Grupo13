from datetime import datetime
import pyotp
from flask import current_app


class TOTPService:
    def __init__(self):
        self.issuer = current_app.config.get('MFA_ISSUER', 'TravelHub')

    def generate_secret(self) -> str:
        return pyotp.random_base32()

    def build_otpauth_uri(self, email: str, secret: str) -> str:
        return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=self.issuer)

    def verify_code(self, secret: str, code: str) -> bool:
        if not code:
            return False
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(code.strip(), valid_window=1, for_time=datetime.utcnow()))
