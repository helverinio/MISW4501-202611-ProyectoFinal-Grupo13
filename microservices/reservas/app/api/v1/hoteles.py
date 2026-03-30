from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateHotelUseCase, GetHotelUseCase, GetAllHotelesUseCase,
    GetHotelesByCiudadUseCase, UpdateHotelUseCase, DeleteHotelUseCase
)
from app.infrastructure.repositories import SQLAlchemyHotelRepository


def get_repository():
    return SQLAlchemyHotelRepository()


@api_v1_bp.route('/hoteles', methods=['POST'])
@require_token
def create_hotel(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    nombre = data.get('nombre')
    email = data.get('email')
    id_ciudad = data.get('id_ciudad')
    if not nombre or not email or not id_ciudad:
        return jsonify({'error': 'nombre, email, and id_ciudad are required'}), 400

    use_case = CreateHotelUseCase(get_repository())
    hotel = use_case.execute(
        nombre, email, id_ciudad,
        data.get('descripcion'), data.get('amenidades')
    )

    return jsonify({
        'id': hotel.id,
        'nombre': hotel.nombre,
        'email': hotel.email,
        'descripcion': hotel.descripcion,
        'amenidades': hotel.amenidades,
        'id_ciudad': hotel.id_ciudad
    }), 201


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['GET'])
@require_token
def get_hotel(hotel_id, current_usuario=None):
    use_case = GetHotelUseCase(get_repository())
    hotel = use_case.execute(hotel_id)

    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    return jsonify({
        'id': hotel.id,
        'nombre': hotel.nombre,
        'email': hotel.email,
        'descripcion': hotel.descripcion,
        'amenidades': hotel.amenidades,
        'id_ciudad': hotel.id_ciudad
    })


@api_v1_bp.route('/hoteles', methods=['GET'])
@require_token
def get_all_hoteles(current_usuario=None):
    use_case = GetAllHotelesUseCase(get_repository())
    hoteles = use_case.execute()

    return jsonify([{
        'id': h.id,
        'nombre': h.nombre,
        'email': h.email,
        'descripcion': h.descripcion,
        'amenidades': h.amenidades,
        'id_ciudad': h.id_ciudad
    } for h in hoteles])


@api_v1_bp.route('/ciudades/<ciudad_id>/hoteles', methods=['GET'])
@require_token
def get_hoteles_by_ciudad(ciudad_id, current_usuario=None):
    use_case = GetHotelesByCiudadUseCase(get_repository())
    hoteles = use_case.execute(ciudad_id)

    return jsonify([{
        'id': h.id,
        'nombre': h.nombre,
        'email': h.email,
        'descripcion': h.descripcion,
        'amenidades': h.amenidades,
        'id_ciudad': h.id_ciudad
    } for h in hoteles])


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['PUT'])
@require_token
def update_hotel(hotel_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateHotelUseCase(get_repository())
    hotel = use_case.execute(hotel_id, **data)

    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    return jsonify({
        'id': hotel.id,
        'nombre': hotel.nombre,
        'email': hotel.email,
        'descripcion': hotel.descripcion,
        'amenidades': hotel.amenidades,
        'id_ciudad': hotel.id_ciudad
    })


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['DELETE'])
@require_token
def delete_hotel(hotel_id, current_usuario=None):
    use_case = DeleteHotelUseCase(get_repository())
    deleted = use_case.execute(hotel_id)

    if not deleted:
        return jsonify({'error': 'Hotel not found'}), 404

    return jsonify({'message': 'Hotel deleted successfully'})
