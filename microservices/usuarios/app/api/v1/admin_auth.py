from flask import jsonify, request

from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    AdminLoginStep1UseCase,
    AdminLoginStep2UseCase,
    RegisterAdminUseCase,
    VerifyAdminSetupUseCase,
)
from app.infrastructure.repositories import SQLAlchemyTokenRepository, SQLAlchemyUsuarioRepository


def get_usuario_repository():
    return SQLAlchemyUsuarioRepository()


def get_token_repository():
    return SQLAlchemyTokenRepository()


@api_v1_bp.route('/admin/auth/register', methods=['POST'])
def register_admin():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = ['nombre', 'email', 'contrasena']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    repo = get_usuario_repository()
    usuario_value = data.get('usuario') or data['email']

    existing_email = repo.find_by_email(data['email'])
    if existing_email:
        return jsonify({'error': 'Email already exists'}), 409

    existing_usuario = repo.find_by_usuario(usuario_value)
    if existing_usuario:
        return jsonify({'error': 'Usuario already exists'}), 409

    use_case = RegisterAdminUseCase(repo)
    result = use_case.execute(
        nombre=data['nombre'],
        email=data['email'],
        contrasena=data['contrasena'],
        usuario=usuario_value,
    )

    return jsonify(result), 201


@api_v1_bp.route('/admin/auth/verify-setup', methods=['POST'])
def verify_admin_setup():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    code = data.get('code')
    if not email or not code:
        return jsonify({'error': 'email and code are required'}), 400

    use_case = VerifyAdminSetupUseCase(get_usuario_repository())
    verified = use_case.execute(email=email, code=code)
    if not verified:
        return jsonify({'error': 'Invalid setup verification code'}), 401

    return jsonify({'message': 'Admin setup verified successfully'})


@api_v1_bp.route('/admin/auth/login/step1', methods=['POST'])
def admin_login_step1():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    identifier = data.get('email') or data.get('usuario')
    contrasena = data.get('contrasena')
    if not identifier or not contrasena:
        return jsonify({'error': 'email or usuario, and contrasena are required'}), 400

    use_case = AdminLoginStep1UseCase(get_usuario_repository())
    result = use_case.execute(identifier=identifier, contrasena=contrasena)

    if not result:
        return jsonify({'error': 'Invalid credentials'}), 401

    if result.get('locked'):
        return jsonify({'error': 'Account temporarily locked', 'locked_until': result.get('locked_until')}), 423

    if result.get('setup_required'):
        return jsonify({'error': 'MFA setup required'}), 403

    return jsonify(result)


@api_v1_bp.route('/admin/auth/login/step2', methods=['POST'])
def admin_login_step2():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    challenge_token = data.get('challenge_token')
    code = data.get('code')
    if not challenge_token or not code:
        return jsonify({'error': 'challenge_token and code are required'}), 400

    use_case = AdminLoginStep2UseCase(get_usuario_repository(), get_token_repository())
    result = use_case.execute(challenge_token=challenge_token, code=code)
    if not result:
        return jsonify({'error': 'Invalid or expired MFA challenge'}), 401

    return jsonify(result)
