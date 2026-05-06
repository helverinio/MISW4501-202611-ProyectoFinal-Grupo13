from flask import Flask
import pytest

from app.application.services.crypto_service import CryptoService
from app.application.services.email_verification_service import EmailVerificationService
from app.application.services.totp_service import TOTPService


class DummyResponse:
    def __init__(self, status_code=200, text='', reason='OK'):
        self.status_code = status_code
        self.text = text
        self.reason = reason


@pytest.fixture
def app_context():
    app = Flask(__name__)
    app.config.update(
        MFA_SECRET_ENCRYPTION_KEY='q9_XAAswDA8QfOlAGWFDGFKbHVOzx9nK6BXQYaQG_9I=',
        MFA_ISSUER='TravelHub',
        JWT_SECRET_KEY='jwt-test-secret',
        EMAILJS_ENABLED=True,
        EMAILJS_ENDPOINT='https://api.emailjs.com/api/v1.0/email/send',
        EMAILJS_SERVICE_ID='service_test',
        EMAILJS_PUBLIC_KEY='public_test',
        EMAILJS_PRIVATE_KEY='',
        EMAILJS_VERIFICATION_TEMPLATE_ID='template_test',
        EMAILJS_ALLOWED_ORIGIN='',
        EMAIL_VERIFICATION_LINK_BASE_URL='http://localhost:4200/verify-email',
        EMAIL_VERIFICATION_TOKEN_EXPIRES=300,
    )
    with app.app_context():
        yield app


def test_crypto_service_encrypt_decrypt_roundtrip(app_context):
    service = CryptoService()

    cipher_text = service.encrypt('super-secret')
    plain_text = service.decrypt(cipher_text)

    assert cipher_text != 'super-secret'
    assert plain_text == 'super-secret'


def test_totp_generate_secret_delegates_to_pyotp(monkeypatch, app_context):
    monkeypatch.setattr(
        'app.application.services.totp_service.pyotp.random_base32',
        lambda: 'ABCDEFGHIJKLMNOPQRSTUVWX23456789',
    )

    service = TOTPService()

    assert service.generate_secret() == 'ABCDEFGHIJKLMNOPQRSTUVWX23456789'


def test_totp_build_otpauth_uri_uses_issuer(monkeypatch, app_context):
    class FakeTOTP:
        def __init__(self, _secret):
            pass

        def provisioning_uri(self, name, issuer_name):
            return f'otpauth://totp/{issuer_name}:{name}'

    monkeypatch.setattr('app.application.services.totp_service.pyotp.TOTP', FakeTOTP)

    service = TOTPService()
    uri = service.build_otpauth_uri('user@example.com', 'ABCDEF1234567890ABCDEF1234567890')

    assert uri == 'otpauth://totp/TravelHub:user@example.com'


def test_totp_verify_code_returns_false_when_code_is_empty(app_context):
    service = TOTPService()
    assert service.verify_code('ABCDEF1234567890ABCDEF1234567890', '') is False


def test_totp_verify_code_strips_code_and_returns_boolean(monkeypatch, app_context):
    captured = {}

    class FakeTOTP:
        def __init__(self, secret):
            captured['secret'] = secret

        def verify(self, code, valid_window, for_time):
            captured['code'] = code
            captured['valid_window'] = valid_window
            captured['for_time_type'] = type(for_time).__name__
            return 1

    monkeypatch.setattr('app.application.services.totp_service.pyotp.TOTP', FakeTOTP)

    service = TOTPService()
    result = service.verify_code('ABCDEF1234567890ABCDEF1234567890', ' 123456 ')

    assert result is True
    assert captured['secret'] == 'ABCDEF1234567890ABCDEF1234567890'
    assert captured['code'] == '123456'
    assert captured['valid_window'] == 1
    assert captured['for_time_type'] == 'datetime'


def test_generate_and_decode_verification_token_ok(app_context):
    service = EmailVerificationService()

    token = service.generate_verification_token('user-1', 'user@example.com')
    payload = service.decode_verification_token(token)

    assert payload['sub'] == 'user-1'
    assert payload['email'] == 'user@example.com'
    assert payload['purpose'] == 'verify_email'


def test_decode_verification_token_rejects_wrong_purpose(app_context):
    import jwt

    token = jwt.encode(
        {'sub': 'u1', 'email': 'a@b.com', 'purpose': 'other'},
        'jwt-test-secret',
        algorithm='HS256',
    )

    service = EmailVerificationService()
    with pytest.raises(ValueError, match='Invalid verification token purpose'):
        service.decode_verification_token(token)


def test_build_verification_link_handles_query_separator(app_context):
    service = EmailVerificationService()

    app_context.config['EMAIL_VERIFICATION_LINK_BASE_URL'] = 'http://localhost:4200/verify-email?lang=es'
    link = service.build_verification_link('a.b/c==')

    assert link.startswith('http://localhost:4200/verify-email?lang=es&token=')
    assert 'a.b/c==' not in link


def test_send_verification_email_returns_false_when_disabled(app_context):
    app_context.config['EMAILJS_ENABLED'] = False
    service = EmailVerificationService()

    result = service.send_verification_email('user@example.com', 'User', 'http://localhost:4200/verify-email')

    assert result is False


def test_send_verification_email_raises_on_incomplete_config(app_context):
    app_context.config['EMAILJS_SERVICE_ID'] = ''
    service = EmailVerificationService()

    with pytest.raises(RuntimeError, match='configuration is incomplete'):
        service.send_verification_email('user@example.com', 'User', 'http://localhost:4200/verify-email')


def test_send_verification_email_posts_payload_and_private_key(monkeypatch, app_context):
    captured = {}
    app_context.config['EMAILJS_PRIVATE_KEY'] = 'private_key_123'

    def fake_post(url, json, headers, timeout):
        captured['url'] = url
        captured['json'] = json
        captured['headers'] = headers
        captured['timeout'] = timeout
        return DummyResponse(200, text='ok')

    monkeypatch.setattr('app.application.services.email_verification_service.requests.post', fake_post)

    service = EmailVerificationService()
    result = service.send_verification_email(
        'user@example.com',
        'User Name',
        'https://web.travelhub.com/verify-email?token=abc',
    )

    assert result is True
    assert captured['url'] == 'https://api.emailjs.com/api/v1.0/email/send'
    assert captured['json']['accessToken'] == 'private_key_123'
    assert captured['json']['template_params']['to_email'] == 'user@example.com'
    assert captured['headers']['Origin'] == 'https://web.travelhub.com'
    assert captured['headers']['Referer'] == 'https://web.travelhub.com'
    assert captured['timeout'] == 15


def test_send_verification_email_uses_allowed_origin_and_raises_on_error(monkeypatch, app_context):
    app_context.config['EMAILJS_ALLOWED_ORIGIN'] = 'http://localhost:4200'

    def fake_post(_url, json=None, headers=None, timeout=None, **_kwargs):
        assert headers['Origin'] == 'http://localhost:4200'
        assert headers['Referer'] == 'http://localhost:4200'
        return DummyResponse(403, text='forbidden', reason='Forbidden')

    monkeypatch.setattr('app.application.services.email_verification_service.requests.post', fake_post)

    service = EmailVerificationService()
    with pytest.raises(RuntimeError, match='EmailJS send failed with 403: forbidden'):
        service.send_verification_email(
            'user@example.com',
            'User Name',
            'https://web.travelhub.com/verify-email?token=abc',
        )