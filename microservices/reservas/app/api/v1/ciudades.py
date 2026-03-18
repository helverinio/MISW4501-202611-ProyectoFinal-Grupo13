from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreateCiudadUseCase, GetCiudadUseCase, GetAllCiudadesUseCase,
    GetCiudadesByPaisUseCase, UpdateCiudadUseCase, DeleteCiudadUseCase
)
from app.infrastructure.repositories import SQLAlchemyCiudadRepository


def get_repository():
    return SQLAlchemyCiudadRepository()


@api_v1_bp.route('/ciudades', methods=['POST'])
def create_ciudad():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    nombre = data.get('nombre')
    id_pais = data.get('id_pais')
    if not nombre or not id_pais:
        return jsonify({'error': 'nombre and id_pais are required'}), 400

    use_case = CreateCiudadUseCase(get_repository())
    ciudad = use_case.execute(nombre, id_pais)

    return jsonify({
        'id': ciudad.id,
        'nombre': ciudad.nombre,
        'id_pais': ciudad.id_pais
    }), 201


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['GET'])
def get_ciudad(ciudad_id):
    use_case = GetCiudadUseCase(get_repository())
    ciudad = use_case.execute(ciudad_id)

    if not ciudad:
        return jsonify({'error': 'Ciudad not found'}), 404

    return jsonify({
        'id': ciudad.id,
        'nombre': ciudad.nombre,
        'id_pais': ciudad.id_pais
    })


@api_v1_bp.route('/ciudades', methods=['GET'])
def get_all_ciudades():
    use_case = GetAllCiudadesUseCase(get_repository())
    ciudades = use_case.execute()

    return jsonify([{
        'id': c.id,
        'nombre': c.nombre,
        'id_pais': c.id_pais
    } for c in ciudades])


@api_v1_bp.route('/paises/<pais_id>/ciudades', methods=['GET'])
def get_ciudades_by_pais(pais_id):
    use_case = GetCiudadesByPaisUseCase(get_repository())
    ciudades = use_case.execute(pais_id)

    return jsonify([{
        'id': c.id,
        'nombre': c.nombre,
        'id_pais': c.id_pais
    } for c in ciudades])


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['PUT'])
def update_ciudad(ciudad_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateCiudadUseCase(get_repository())
    ciudad = use_case.execute(ciudad_id, **data)

    if not ciudad:
        return jsonify({'error': 'Ciudad not found'}), 404

    return jsonify({
        'id': ciudad.id,
        'nombre': ciudad.nombre,
        'id_pais': ciudad.id_pais
    })


@api_v1_bp.route('/ciudades/<ciudad_id>', methods=['DELETE'])
def delete_ciudad(ciudad_id):
    use_case = DeleteCiudadUseCase(get_repository())
    deleted = use_case.execute(ciudad_id)

    if not deleted:
        return jsonify({'error': 'Ciudad not found'}), 404

    return jsonify({'message': 'Ciudad deleted successfully'})
