from flask import jsonify
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
