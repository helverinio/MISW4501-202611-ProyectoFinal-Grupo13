from flask import jsonify, request
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases.comentario_hotel_use_cases import (
    CreateComentarioHotelUseCase,
    GetHotelRatingSummaryUseCase,
    ListComentariosHotelUseCase,
    RatingAggregationService,
)
from app.infrastructure.repositories import (
    SQLAlchemyComentarioHotelRepository,
    SQLAlchemyHotelRepository,
)


def _build_services():
    repository = SQLAlchemyComentarioHotelRepository()
    rating_service = RatingAggregationService(repository)
    return (
        CreateComentarioHotelUseCase(repository, rating_service),
        ListComentariosHotelUseCase(repository, rating_service),
        GetHotelRatingSummaryUseCase(rating_service),
        SQLAlchemyHotelRepository(),
    )


def _resolve_usuario_id(current_usuario, body_id_usuario):
    token_user_id = current_usuario.get('id') if isinstance(current_usuario, dict) else None

    if token_user_id and body_id_usuario and token_user_id != body_id_usuario:
        raise ValueError('id_usuario no coincide con el usuario autenticado')

    return token_user_id or body_id_usuario


@api_v1_bp.route('/hoteles/<hotel_id>/comentarios', methods=['POST'])
@require_token
def create_comentario_hotel(hotel_id, current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    id_reserva = data.get('id_reserva')
    rating = data.get('rating')
    comentario = data.get('comentario')

    if id_reserva is None or rating is None:
        return jsonify({'error': 'id_reserva y rating son requeridos'}), 400

    try:
        id_usuario = _resolve_usuario_id(current_usuario, data.get('id_usuario'))
    except ValueError as ex:
        return jsonify({'error': str(ex)}), 403

    if not id_usuario:
        return jsonify({'error': 'No fue posible determinar id_usuario'}), 400

    create_use_case, _, get_rating_use_case, hotel_repository = _build_services()
    hotel = hotel_repository.find_by_id(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    try:
        result = create_use_case.execute(
            id_hotel=hotel_id,
            id_usuario=id_usuario,
            id_reserva=id_reserva,
            rating=rating,
            comentario=comentario,
        )
    except ValueError as ex:
        message = str(ex)
        status_code = 422
        if 'rating' in message or 'page' in message or 'per_page' in message:
            status_code = 400
        return jsonify({'error': message}), status_code

    created = result['comentario']
    rating_summary = get_rating_use_case.execute(hotel_id)

    return jsonify({
        'id': created.id,
        'id_hotel': created.id_hotel,
        'id_usuario': created.id_usuario,
        'id_reserva': created.id_reserva,
        'comentario': created.comentario,
        'rating': created.rating,
        'created_at': created.created_at.isoformat(),
        'updated_at': created.updated_at.isoformat(),
        'rating_hotel': rating_summary,
    }), 201


@api_v1_bp.route('/hoteles/<hotel_id>/comentarios', methods=['GET'])
def list_comentarios_hotel(hotel_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    _, list_use_case, _, hotel_repository = _build_services()
    hotel = hotel_repository.find_by_id(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    try:
        result = list_use_case.execute(id_hotel=hotel_id, page=page, per_page=per_page)
    except ValueError as ex:
        return jsonify({'error': str(ex)}), 400

    return jsonify({
        'hotel_id': hotel_id,
        'rating_hotel': result['rating_hotel'],
        'pagination': {
            'total': result['total'],
            'page': result['page'],
            'per_page': result['per_page'],
            'total_pages': (result['total'] + per_page - 1) // per_page if per_page else 0,
        },
        'comentarios': [
            {
                'id': c.id,
                'id_usuario': c.id_usuario,
                'id_reserva': c.id_reserva,
                'comentario': c.comentario,
                'rating': c.rating,
                'created_at': c.created_at.isoformat() if c.created_at else None,
                'updated_at': c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in result['comentarios']
        ],
    }), 200


@api_v1_bp.route('/hoteles/<hotel_id>/rating', methods=['GET'])
def get_hotel_rating(hotel_id):
    _, _, get_rating_use_case, hotel_repository = _build_services()
    hotel = hotel_repository.find_by_id(hotel_id)
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404

    summary = get_rating_use_case.execute(hotel_id)

    return jsonify({
        'hotel_id': hotel_id,
        'rating_promedio': summary['rating_promedio'],
        'cantidad_ratings': summary['cantidad_ratings'],
        'cantidad_comentarios': summary['cantidad_comentarios'],
    }), 200
