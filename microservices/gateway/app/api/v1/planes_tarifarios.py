from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


# ── Planes tarifarios ─────────────────────────────────────────────────────────

@api_v1_bp.route('/tipos-habitacion/<tipo_id>/planes-tarifarios', methods=['GET'])
def get_planes_by_tipo(tipo_id):
    result = get_service().get_planes_by_tipo(tipo_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/tipos-habitacion/<tipo_id>/planes-tarifarios', methods=['POST'])
def create_plan_tarifario(tipo_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_plan_tarifario(tipo_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['GET'])
def get_plan_tarifario(plan_id):
    result = get_service().get_plan_tarifario(plan_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['PUT'])
def update_plan_tarifario(plan_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_plan_tarifario(plan_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['DELETE'])
def delete_plan_tarifario(plan_id):
    result = get_service().delete_plan_tarifario(plan_id)
    return jsonify(result['data']), result['status_code']


# ── Reglas tarifarias ─────────────────────────────────────────────────────────

@api_v1_bp.route('/planes-tarifarios/<plan_id>/reglas', methods=['GET'])
def get_reglas_by_plan(plan_id):
    result = get_service().get_reglas_by_plan(plan_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/planes-tarifarios/<plan_id>/reglas', methods=['POST'])
def create_regla_tarifaria(plan_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_regla_tarifaria(plan_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['GET'])
def get_regla_tarifaria(regla_id):
    result = get_service().get_regla_tarifaria(regla_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['PUT'])
def update_regla_tarifaria(regla_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_regla_tarifaria(regla_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['DELETE'])
def delete_regla_tarifaria(regla_id):
    result = get_service().delete_regla_tarifaria(regla_id)
    return jsonify(result['data']), result['status_code']
