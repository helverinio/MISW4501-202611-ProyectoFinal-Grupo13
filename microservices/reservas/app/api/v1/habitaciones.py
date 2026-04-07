from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateHabitacionUseCase, GetHabitacionUseCase, GetAllHabitacionesUseCase,
    GetHabitacionesByHotelUseCase, UpdateHabitacionUseCase, DeleteHabitacionUseCase
)
from app.infrastructure.repositories import SQLAlchemyHabitacionRepository


def get_repository():
    return SQLAlchemyHabitacionRepository()


@api_v1_bp.route('/habitaciones', methods=['POST'])
@require_token
def create_habitacion(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    tipo = data.get('tipo')
    nro_habitacion = data.get('nro_habitacion')
    capacidad = data.get('capacidad')
    camas = data.get('camas')
    id_hotel = data.get('id_hotel')
    id_tipo_habitacion = data.get('id_tipo_habitacion')

    if not all([tipo, nro_habitacion is not None, capacidad is not None, camas is not None, id_hotel]):
        return jsonify({'error': 'tipo, nro_habitacion, capacidad, camas, and id_hotel are required'}), 400

    use_case = CreateHabitacionUseCase(get_repository())
    habitacion = use_case.execute(tipo, nro_habitacion, capacidad, camas, id_hotel, id_tipo_habitacion)

    return jsonify({
        'id': habitacion.id,
        'tipo': habitacion.tipo,
        'nro_habitacion': habitacion.nro_habitacion,
        'capacidad': habitacion.capacidad,
        'camas': habitacion.camas,
        'id_hotel': habitacion.id_hotel,
        'id_tipo_habitacion': habitacion.id_tipo_habitacion
    }), 201


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['GET'])
@require_token
def get_habitacion(habitacion_id, current_usuario=None):
    use_case = GetHabitacionUseCase(get_repository())
    habitacion = use_case.execute(habitacion_id)

    if not habitacion:
        return jsonify({'error': 'Habitacion not found'}), 404

    return jsonify({
        'id': habitacion.id,
        'tipo': habitacion.tipo,
        'nro_habitacion': habitacion.nro_habitacion,
        'capacidad': habitacion.capacidad,
        'camas': habitacion.camas,
        'id_hotel': habitacion.id_hotel,
        'id_tipo_habitacion': habitacion.id_tipo_habitacion
    })


@api_v1_bp.route('/habitaciones', methods=['GET'])
@require_token
def get_all_habitaciones(current_usuario=None):
    use_case = GetAllHabitacionesUseCase(get_repository())
    habitaciones = use_case.execute()

    return jsonify([{
        'id': h.id,
        'tipo': h.tipo,
        'nro_habitacion': h.nro_habitacion,
        'capacidad': h.capacidad,
        'camas': h.camas,
        'id_hotel': h.id_hotel,
        'id_tipo_habitacion': h.id_tipo_habitacion
    } for h in habitaciones])


@api_v1_bp.route('/hoteles/<hotel_id>/habitaciones', methods=['GET'])
@require_token
def get_habitaciones_by_hotel(hotel_id, current_usuario=None):
    use_case = GetHabitacionesByHotelUseCase(get_repository())
    habitaciones = use_case.execute(hotel_id)

    return jsonify([{
        'id': h.id,
        'tipo': h.tipo,
        'nro_habitacion': h.nro_habitacion,
        'capacidad': h.capacidad,
        'camas': h.camas,
        'id_hotel': h.id_hotel,
        'id_tipo_habitacion': h.id_tipo_habitacion
    } for h in habitaciones])


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['PUT'])
@require_token
def update_habitacion(habitacion_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateHabitacionUseCase(get_repository())
    habitacion = use_case.execute(habitacion_id, **data)

    if not habitacion:
        return jsonify({'error': 'Habitacion not found'}), 404

    return jsonify({
        'id': habitacion.id,
        'tipo': habitacion.tipo,
        'nro_habitacion': habitacion.nro_habitacion,
        'capacidad': habitacion.capacidad,
        'camas': habitacion.camas,
        'id_hotel': habitacion.id_hotel,
        'id_tipo_habitacion': habitacion.id_tipo_habitacion
    })


@api_v1_bp.route('/habitaciones/<habitacion_id>', methods=['DELETE'])
@require_token
def delete_habitacion(habitacion_id, current_usuario=None):
    use_case = DeleteHabitacionUseCase(get_repository())
    deleted = use_case.execute(habitacion_id)

    if not deleted:
        return jsonify({'error': 'Habitacion not found'}), 404

    return jsonify({'message': 'Habitacion deleted successfully'})
