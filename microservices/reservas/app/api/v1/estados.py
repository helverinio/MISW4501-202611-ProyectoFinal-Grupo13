from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateEstadoUseCase, GetEstadoUseCase, GetAllEstadosUseCase,
    UpdateEstadoUseCase, DeleteEstadoUseCase
)
from app.infrastructure.repositories import SQLAlchemyEstadoRepository


def get_repository():
    return SQLAlchemyEstadoRepository()


@api_v1_bp.route('/estados', methods=['POST'])
@require_token
def create_estado(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'nombre is required'}), 400

    use_case = CreateEstadoUseCase(get_repository())
    estado = use_case.execute(nombre, data.get('descripcion'))

    return jsonify({
        'id': estado.id,
        'nombre': estado.nombre,
        'descripcion': estado.descripcion
    }), 201


@api_v1_bp.route('/estados/<estado_id>', methods=['GET'])
@require_token
def get_estado(estado_id, current_usuario=None):
    use_case = GetEstadoUseCase(get_repository())
    estado = use_case.execute(estado_id)

    if not estado:
        return jsonify({'error': 'Estado not found'}), 404

    return jsonify({
        'id': estado.id,
        'nombre': estado.nombre,
        'descripcion': estado.descripcion
    })


@api_v1_bp.route('/estados', methods=['GET'])
@require_token
def get_all_estados(current_usuario=None):
    use_case = GetAllEstadosUseCase(get_repository())
    estados = use_case.execute()

    return jsonify([{
        'id': e.id,
        'nombre': e.nombre,
        'descripcion': e.descripcion
    } for e in estados])


@api_v1_bp.route('/estados/<estado_id>', methods=['PUT'])
@require_token
def update_estado(estado_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateEstadoUseCase(get_repository())
    estado = use_case.execute(estado_id, **data)

    if not estado:
        return jsonify({'error': 'Estado not found'}), 404

    return jsonify({
        'id': estado.id,
        'nombre': estado.nombre,
        'descripcion': estado.descripcion
    })


@api_v1_bp.route('/estados/<estado_id>', methods=['DELETE'])
@require_token
def delete_estado(estado_id, current_usuario=None):
    use_case = DeleteEstadoUseCase(get_repository())
    deleted = use_case.execute(estado_id)

    if not deleted:
        return jsonify({'error': 'Estado not found'}), 404

    return jsonify({'message': 'Estado deleted successfully'})
