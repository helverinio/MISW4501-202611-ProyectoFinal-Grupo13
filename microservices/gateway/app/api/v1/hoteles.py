from flask import request, jsonify, current_app
from app.api.v1 import api_v1_bp
from app.services import ReservasService


def get_service():
    return ReservasService(current_app.config['RESERVAS_SERVICE_URL'])


@api_v1_bp.route('/hoteles', methods=['POST'])
def create_hotel():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().create_hotel(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    result = get_service().get_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles', methods=['GET'])
def get_all_hoteles():
    result = get_service().get_all_hoteles()
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['PUT'])
def update_hotel(hotel_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().update_hotel(hotel_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>', methods=['DELETE'])
def delete_hotel(hotel_id):
    result = get_service().delete_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>/habitaciones', methods=['GET'])
def get_habitaciones_by_hotel(hotel_id):
    result = get_service().get_habitaciones_by_hotel(hotel_id)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/buscar-disponibles', methods=['POST'])
def search_available_hotels():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = get_service().search_available_hotels(data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/populares-por-ciudad', methods=['GET'])
def get_popular_destinations_by_city():
    limit = request.args.get('limit', default=4, type=int)
    result = get_service().get_popular_destinations_by_city(limit)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>/comentarios', methods=['GET'])
def get_hotel_comments(hotel_id):
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)
    result = get_service().get_hotel_comments(hotel_id, page=page, per_page=per_page)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>/comentarios', methods=['POST'])
def create_hotel_comment(hotel_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    result = get_service().create_hotel_comment(hotel_id, data)
    return jsonify(result['data']), result['status_code']


@api_v1_bp.route('/hoteles/<hotel_id>/rating', methods=['GET'])
def get_hotel_rating(hotel_id):
    result = get_service().get_hotel_rating(hotel_id)
    return jsonify(result['data']), result['status_code']
