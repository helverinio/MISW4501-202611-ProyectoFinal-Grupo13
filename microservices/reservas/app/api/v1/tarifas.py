from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    CreateTarifaUseCase, GetTarifaUseCase, GetAllTarifasUseCase,
    GetTarifasByHabitacionUseCase, UpdateTarifaUseCase, DeleteTarifaUseCase
)
from app.infrastructure.repositories import SQLAlchemyTarifaRepository


def get_repository():
    return SQLAlchemyTarifaRepository()


@api_v1_bp.route('/tarifas', methods=['POST'])
@require_token
def create_tarifa(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    nombre = data.get('nombre')
    valor = data.get('valor')
    descuento = data.get('descuento', 0.0)
    id_habitacion = data.get('id_habitacion')

    if not nombre or valor is None or not id_habitacion:
        return jsonify({'error': 'nombre, valor, and id_habitacion are required'}), 400

    use_case = CreateTarifaUseCase(get_repository())
    tarifa = use_case.execute(nombre, valor, descuento, id_habitacion)

    return jsonify({
        'id': tarifa.id,
        'nombre': tarifa.nombre,
        'valor': tarifa.valor,
        'descuento': tarifa.descuento,
        'id_habitacion': tarifa.id_habitacion
    }), 201


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['GET'])
@require_token
def get_tarifa(tarifa_id, current_usuario=None):
    use_case = GetTarifaUseCase(get_repository())
    tarifa = use_case.execute(tarifa_id)

    if not tarifa:
        return jsonify({'error': 'Tarifa not found'}), 404

    return jsonify({
        'id': tarifa.id,
        'nombre': tarifa.nombre,
        'valor': tarifa.valor,
        'descuento': tarifa.descuento,
        'id_habitacion': tarifa.id_habitacion
    })


@api_v1_bp.route('/tarifas', methods=['GET'])
@require_token
def get_all_tarifas(current_usuario=None):
    use_case = GetAllTarifasUseCase(get_repository())
    tarifas = use_case.execute()

    return jsonify([{
        'id': t.id,
        'nombre': t.nombre,
        'valor': t.valor,
        'descuento': t.descuento,
        'id_habitacion': t.id_habitacion
    } for t in tarifas])


@api_v1_bp.route('/habitaciones/<habitacion_id>/tarifas', methods=['GET'])
@require_token
def get_tarifas_by_habitacion(habitacion_id, current_usuario=None):
    use_case = GetTarifasByHabitacionUseCase(get_repository())
    tarifas = use_case.execute(habitacion_id)

    return jsonify([{
        'id': t.id,
        'nombre': t.nombre,
        'valor': t.valor,
        'descuento': t.descuento,
        'id_habitacion': t.id_habitacion
    } for t in tarifas])


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['PUT'])
@require_token
def update_tarifa(tarifa_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    use_case = UpdateTarifaUseCase(get_repository())
    tarifa = use_case.execute(tarifa_id, **data)

    if not tarifa:
        return jsonify({'error': 'Tarifa not found'}), 404

    return jsonify({
        'id': tarifa.id,
        'nombre': tarifa.nombre,
        'valor': tarifa.valor,
        'descuento': tarifa.descuento,
        'id_habitacion': tarifa.id_habitacion
    })


@api_v1_bp.route('/tarifas/<tarifa_id>', methods=['DELETE'])
@require_token
def delete_tarifa(tarifa_id, current_usuario=None):
    use_case = DeleteTarifaUseCase(get_repository())
    deleted = use_case.execute(tarifa_id)

    if not deleted:
        return jsonify({'error': 'Tarifa not found'}), 404

    return jsonify({'message': 'Tarifa deleted successfully'})
