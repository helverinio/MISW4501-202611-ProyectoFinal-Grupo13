from datetime import datetime, timedelta
from urllib.parse import urlparse
from urllib.parse import quote

import jwt
import requests
from flask import current_app


class EmailVerificationService:
    def generate_verification_token(self, user_id: str, email: str) -> str:
        now = datetime.utcnow()
        expires_in = int(current_app.config.get('EMAIL_VERIFICATION_TOKEN_EXPIRES', 86400))
        payload = {
            'sub': user_id,
            'email': email,
            'purpose': 'verify_email',
            'iat': now,
            'exp': now + timedelta(seconds=expires_in),
        }
        return jwt.encode(payload, current_app.config.get('JWT_SECRET_KEY'), algorithm='HS256')

    def decode_verification_token(self, token: str) -> dict:
        payload = jwt.decode(
            token,
            current_app.config.get('JWT_SECRET_KEY'),
            algorithms=['HS256'],
        )
        if payload.get('purpose') != 'verify_email':
            raise ValueError('Invalid verification token purpose')
        return payload

    def build_verification_link(self, token: str) -> str:
        base_url = str(current_app.config.get('EMAIL_VERIFICATION_LINK_BASE_URL', '')).strip()
        separator = '&' if '?' in base_url else '?'
        return f"{base_url}{separator}token={quote(token)}"

    def send_verification_email(self, to_email: str, user_name: str, verification_link: str) -> bool:
        if not current_app.config.get('EMAILJS_ENABLED', True):
            return False

        endpoint = str(current_app.config.get('EMAILJS_ENDPOINT', '')).strip()
        service_id = str(current_app.config.get('EMAILJS_SERVICE_ID', '')).strip()
        public_key = str(current_app.config.get('EMAILJS_PUBLIC_KEY', '')).strip()
        private_key = str(current_app.config.get('EMAILJS_PRIVATE_KEY', '')).strip()
        template_id = str(current_app.config.get('EMAILJS_VERIFICATION_TEMPLATE_ID', '')).strip()
        allowed_origin = str(current_app.config.get('EMAILJS_ALLOWED_ORIGIN', '')).strip()

        if not endpoint or not service_id or not public_key or not template_id:
            raise RuntimeError('EmailJS verification configuration is incomplete')

        payload = {
            'service_id': service_id,
            'template_id': template_id,
            'user_id': public_key,
            'template_params': {
                'to_email': to_email,
                'email': to_email,
                'user_name': user_name,
                'verification_link': verification_link,
            },
        }
        if private_key:
            payload['accessToken'] = private_key

        request_headers = {'Content-Type': 'application/json'}
        origin = allowed_origin
        if not origin:
            parsed_url = urlparse(verification_link)
            if parsed_url.scheme and parsed_url.netloc:
                origin = f'{parsed_url.scheme}://{parsed_url.netloc}'
        if origin:
            request_headers['Origin'] = origin
            request_headers['Referer'] = origin

        response = requests.post(
            endpoint,
            json=payload,
            headers=request_headers,
            timeout=15,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f'EmailJS send failed with {response.status_code}: {response.text.strip() or response.reason}'
            )
        return True
