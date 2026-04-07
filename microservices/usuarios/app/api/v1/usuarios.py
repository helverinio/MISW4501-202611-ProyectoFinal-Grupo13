from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreateUsuarioUseCase, GetUsuarioUseCase, GetAllUsuariosUseCase,
    UpdateUsuarioUseCase, DeleteUsuarioUseCase
)
from app.infrastructure.repositories import SQLAlchemyUsuarioRepository


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
    usuario = use_case.execute(
        nombre=data['nombre'],
        email=data['email'],
        usuario=usuario_value,
        contrasena=data['contrasena'],
        ciudad_id=data.get('ciudad_id')
    )

    return jsonify({
        'id': usuario.id,
        'nombre': usuario.nombre,
        'email': usuario.email,
        'usuario': usuario.usuario,
        'ciudad_id': usuario.ciudad_id,
        'creado_en': usuario.creado_en.isoformat() if usuario.creado_en else None
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
        'creado_en': usuario.creado_en.isoformat() if usuario.creado_en else None
    })


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['DELETE'])
def delete_usuario(usuario_id):
    use_case = DeleteUsuarioUseCase(get_repository())
    deleted = use_case.execute(usuario_id)

    if not deleted:
        return jsonify({'error': 'Usuario not found'}), 404

    return jsonify({'message': 'Usuario deleted successfully'})
