import jwt

from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.application.services import EmailVerificationService
from app.application.use_cases import (
    AuthenticateUseCase, RefreshTokenUseCase, GetUsuarioByTokenUseCase,
    RevokeTokenUseCase
)
from app.infrastructure.repositories import SQLAlchemyUsuarioRepository, SQLAlchemyTokenRepository


def get_usuario_repository():
    return SQLAlchemyUsuarioRepository()


def get_token_repository():
    return SQLAlchemyTokenRepository()


@api_v1_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    identifier = data.get('email') or data.get('usuario')
    contrasena = data.get('contrasena')

    if not identifier or not contrasena:
        return jsonify({'error': 'email or usuario, and contrasena are required'}), 400

    use_case = AuthenticateUseCase(get_usuario_repository(), get_token_repository())
    try:
        result = use_case.execute(identifier, contrasena)
    except PermissionError as error:
        if str(error) == 'EMAIL_NOT_VERIFIED':
            return jsonify({
                'error': 'Email not verified',
                'code': 'EMAIL_NOT_VERIFIED',
            }), 403
        raise

    if not result:
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify(result)


@api_v1_bp.route('/auth/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    token = data.get('token')
    if not token:
        return jsonify({'error': 'token is required'}), 400

    verification_service = EmailVerificationService()
    try:
        payload = verification_service.decode_verification_token(token)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Verification token expired', 'code': 'TOKEN_EXPIRED'}), 410
    except (jwt.InvalidTokenError, ValueError):
        return jsonify({'error': 'Invalid verification token', 'code': 'INVALID_TOKEN'}), 400

    user_id = payload.get('sub')
    email = payload.get('email')
    if not user_id or not email:
        return jsonify({'error': 'Invalid verification token', 'code': 'INVALID_TOKEN'}), 400

    repo = get_usuario_repository()
    user = repo.find_by_id(user_id)
    if not user or user.email != email:
        return jsonify({'error': 'Invalid verification token', 'code': 'INVALID_TOKEN'}), 400

    active_status = current_app.config.get('EMAIL_VERIFICATION_ACTIVE_STATUS', 'ACTIVE')

    if user.status == active_status:
        return jsonify({'message': 'Email already verified', 'status': user.status}), 200

    user.status = active_status
    repo.update(user)
    return jsonify({'message': 'Email verified successfully', 'status': user.status}), 200


@api_v1_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    refresh_token = data.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'refresh_token is required'}), 400

    use_case = RefreshTokenUseCase(get_usuario_repository(), get_token_repository())
    result = use_case.execute(refresh_token)

    if not result:
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    return jsonify(result)


@api_v1_bp.route('/auth/me', methods=['GET'])
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header is required'}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'error': 'Invalid authorization header format'}), 401

    access_token = parts[1]

    use_case = GetUsuarioByTokenUseCase(get_usuario_repository(), get_token_repository())
    usuario = use_case.execute(access_token)

    if not usuario:
        return jsonify({'error': 'Invalid or expired token'}), 401

    return jsonify({
        'id': usuario.id,
        'nombre': usuario.nombre,
        'email': usuario.email,
        'usuario': usuario.usuario,
        'ciudad_id': usuario.ciudad_id,
        'role': usuario.role,
        'status': usuario.status,
        'mfa_enabled': usuario.mfa_enabled,
        'creado_en': usuario.creado_en.isoformat() if usuario.creado_en else None
    })


@api_v1_bp.route('/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header is required'}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'error': 'Invalid authorization header format'}), 401

    access_token = parts[1]

    use_case = RevokeTokenUseCase(get_token_repository())
    use_case.execute(access_token)

    return jsonify({'message': 'Logged out successfully'})
