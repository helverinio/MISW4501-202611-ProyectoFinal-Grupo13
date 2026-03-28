from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreatePaisUseCase, GetPaisUseCase, GetAllPaisesUseCase,
    UpdatePaisUseCase, DeletePaisUseCase
)
from app.infrastructure.repositories import SQLAlchemyPaisRepository


def get_repository():
    return SQLAlchemyPaisRepository()


@api_v1_bp.route('/paises', methods=['POST'])
@require_token
def create_pais(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'nombre is required'}), 400

    use_case = CreatePaisUseCase(get_repository())
    pais = use_case.execute(nombre)

    return jsonify({
        'id': pais.id,
        'nombre': pais.nombre
    }), 201


@api_v1_bp.route('/paises/<pais_id>', methods=['GET'])
@require_token
def get_pais(pais_id, current_usuario=None):
    use_case = GetPaisUseCase(get_repository())
    pais = use_case.execute(pais_id)

    if not pais:
        return jsonify({'error': 'Pais not found'}), 404

    return jsonify({
        'id': pais.id,
        'nombre': pais.nombre
    })


@api_v1_bp.route('/paises', methods=['GET'])
@require_token
def get_all_paises(current_usuario=None):
    use_case = GetAllPaisesUseCase(get_repository())
    paises = use_case.execute()

    return jsonify([{
        'id': p.id,
        'nombre': p.nombre
    } for p in paises])


@api_v1_bp.route('/paises/<pais_id>', methods=['PUT'])
@require_token
def update_pais(pais_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdatePaisUseCase(get_repository())
    pais = use_case.execute(pais_id, **data)

    if not pais:
        return jsonify({'error': 'Pais not found'}), 404

    return jsonify({
        'id': pais.id,
        'nombre': pais.nombre
    })


@api_v1_bp.route('/paises/<pais_id>', methods=['DELETE'])
@require_token
def delete_pais(pais_id, current_usuario=None):
    use_case = DeletePaisUseCase(get_repository())
    deleted = use_case.execute(pais_id)

    if not deleted:
        return jsonify({'error': 'Pais not found'}), 404

    return jsonify({'message': 'Pais deleted successfully'})
