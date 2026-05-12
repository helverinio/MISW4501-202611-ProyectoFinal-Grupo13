from flask import jsonify, request
from app.api.v1 import api_v1_bp
from app.services import ReservasService
from flask import current_app


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/admin/mis-hoteles', methods=['GET'])
def get_mis_hoteles():
    result = get_service().get_mis_hoteles()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/hoteles/<hotel_id>/asignar', methods=['POST'])
def asignar_hotel(hotel_id):
    result = get_service().asignar_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/hoteles/<hotel_id>/desasignar', methods=['DELETE'])
def desasignar_hotel(hotel_id):
    result = get_service().desasignar_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/reservas/dashboard', methods=['GET'])
def get_admin_reservas_dashboard():
    params = request.args.to_dict()
    result = get_service().get_admin_reservas_dashboard(params=params or None)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/revenue-report', methods=['GET'])
def get_admin_revenue_report():
    params = request.args.to_dict()
    result = get_service().get_admin_revenue_report(params=params or None)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/reservas/<reserva_id>', methods=['GET'])
def get_admin_reserva_detail(reserva_id):
    result = get_service().get_admin_reserva_detail(reserva_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/reservas/<reserva_id>/estado', methods=['PUT'])
def update_reserva_estado(reserva_id):
    data = request.get_json() or {}
    result = get_service().update_reserva_estado(reserva_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/admin/reviews', methods=['GET'])
def get_admin_reviews():
    params = request.args.to_dict()
    result = get_service().get_admin_reviews(params=params or None)
    return jsonify(result['data']), result['status_code']
