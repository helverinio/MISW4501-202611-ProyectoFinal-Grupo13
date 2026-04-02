from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import UsuariosService


def get_service():
    return UsuariosService(current_app.config['USUARIOS_SERVICE_URL'])


@api_v1_bp.route('/usuarios', methods=['POST'])
def create_usuario():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_usuario(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    result = get_service().get_usuario(usuario_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios', methods=['GET'])
def get_all_usuarios():
    result = get_service().get_all_usuarios()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['PUT'])
def update_usuario(usuario_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_usuario(usuario_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/usuarios/<usuario_id>', methods=['DELETE'])
def delete_usuario(usuario_id):
    result = get_service().delete_usuario(usuario_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if not data.get('email') or not data.get('contrasena'):
        return jsonify({'error': 'email and contrasena are required'}), 400
    result = get_service().login(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().refresh_token(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/auth/me', methods=['GET'])
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header is required'}), 401
    result = get_service().get_current_user(auth_header)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header is required'}), 401
    result = get_service().logout(auth_header)
    return jsonify(result['data']), result['status_code']
