import logging

from flask import request, jsonify
from flask import current_app
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreateUsuarioUseCase, GetUsuarioUseCase, GetAllUsuariosUseCase,
    UpdateUsuarioUseCase, DeleteUsuarioUseCase
)
from app.application.services import EmailVerificationService
from app.infrastructure.repositories import SQLAlchemyUsuarioRepository


logger = logging.getLogger(__name__)


def get_repository():
    return SQLAlchemyUsuarioRepository()


@api_v1_bp.route('/usuarios', methods=['POST'])
def create_usuario():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required_fields = ['nombre', 'email', 'contrasena']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    repo = get_repository()

    usuario_value = data.get('usuario') or data['email']

    existing_usuario = repo.find_by_usuario(usuario_value)
    if existing_usuario:
        return jsonify({'error': 'Usuario already exists'}), 409

    existing_email = repo.find_by_email(data['email'])
    if existing_email:
        return jsonify({'error': 'Email already exists'}), 409

    use_case = CreateUsuarioUseCase(repo)
    pending_status = str(current_app.config.get('EMAIL_VERIFICATION_PENDING_STATUS', 'PENDING_EMAIL')).strip()
    if not pending_status:
        pending_status = 'PENDING_EMAIL'
    if len(pending_status) > 20:
        logger.warning('EMAIL_VERIFICATION_PENDING_STATUS exceeds 20 chars; falling back to PENDING_EMAIL')
        pending_status = 'PENDING_EMAIL'
    usuario = use_case.execute(
        nombre=data['nombre'],
        email=data['email'],
        usuario=usuario_value,
        contrasena=data['contrasena'],
        ciudad_id=data.get('ciudad_id'),
        status=pending_status,
    )

    verification_email_sent = False
    try:
        verification_service = EmailVerificationService()
        token = verification_service.generate_verification_token(usuario.id, usuario.email)
        verification_link = verification_service.build_verification_link(token)
        verification_email_sent = verification_service.send_verification_email(
            to_email=usuario.email,
            user_name=usuario.nombre,
            verification_link=verification_link,
        )
    except Exception as error:
        logger.exception('Could not send verification email for user %s: %s', usuario.id, error)

    return jsonify({
        'id': usuario.id,
        'nombre': usuario.nombre,
        'email': usuario.email,
        'usuario': usuario.usuario,
        'ciudad_id': usuario.ciudad_id,
        'role': usuario.role,
        'status': usuario.status,
        'mfa_enabled': usuario.mfa_enabled,
        'creado_en': usuario.creado_en.isoformat() if usuario.creado_en else None,
        'verification_email_sent': verification_email_sent,
    }), 201


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    use_case = GetUsuarioUseCase(get_repository())
    usuario = use_case.execute(usuario_id)

    if not usuario:
        return jsonify({'error': 'Usuario not found'}), 404

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


@api_v1_bp.route('/usuarios', methods=['GET'])
def get_all_usuarios():
    use_case = GetAllUsuariosUseCase(get_repository())
    usuarios = use_case.execute()

    return jsonify([{
        'id': u.id,
        'nombre': u.nombre,
        'email': u.email,
        'usuario': u.usuario,
        'ciudad_id': u.ciudad_id,
        'role': u.role,
        'status': u.status,
        'mfa_enabled': u.mfa_enabled,
        'creado_en': u.creado_en.isoformat() if u.creado_en else None
    } for u in usuarios])


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['PUT'])
def update_usuario(usuario_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateUsuarioUseCase(get_repository())
    usuario = use_case.execute(usuario_id, **data)

    if not usuario:
        return jsonify({'error': 'Usuario not found'}), 404

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


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['DELETE'])
def delete_usuario(usuario_id):
    use_case = DeleteUsuarioUseCase(get_repository())
    deleted = use_case.execute(usuario_id)

    if not deleted:
        return jsonify({'error': 'Usuario not found'}), 404

    return jsonify({'message': 'Usuario deleted successfully'})
