from flask import request, jsonify
from app.api.v1 import api_v1_bp
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

    email = data.get('email')
    contrasena = data.get('contrasena')

    if not email or not contrasena:
        return jsonify({'error': 'email and contrasena are required'}), 400

    use_case = AuthenticateUseCase(get_usuario_repository(), get_token_repository())
    result = use_case.execute(email, contrasena)

    if not result:
        return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify(result)


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
