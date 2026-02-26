from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.application.use_cases import (
    CreateReservationUseCase,
    GetReservationUseCase,
    GetAllReservationsUseCase,
    UpdateReservationUseCase,
    DeleteReservationUseCase
)
from app.infrastructure.repositories import SQLAlchemyReservationRepository

def get_repository():
    return SQLAlchemyReservationRepository()

@api_v1_bp.route('/reservations', methods=['POST'])
def create_reservation():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user_id = data.get('user_id')
    event_id = data.get('event_id')
    seat_number = data.get('seat_number')
    
    if not user_id or not event_id:
        return jsonify({'error': 'user_id and event_id are required'}), 400
    
    use_case = CreateReservationUseCase(get_repository())
    reservation = use_case.execute(user_id, event_id, seat_number)
    
    return jsonify({
        'id': reservation.id,
        'user_id': reservation.user_id,
        'event_id': reservation.event_id,
        'seat_number': reservation.seat_number,
        'status': reservation.status,
        'created_at': reservation.created_at.isoformat(),
        'updated_at': reservation.updated_at.isoformat()
    }), 201

@api_v1_bp.route('/reservations/<reservation_id>', methods=['GET'])
def get_reservation(reservation_id):
    use_case = GetReservationUseCase(get_repository())
    reservation = use_case.execute(reservation_id)
    
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    return jsonify({
        'id': reservation.id,
        'user_id': reservation.user_id,
        'event_id': reservation.event_id,
        'seat_number': reservation.seat_number,
        'status': reservation.status,
        'created_at': reservation.created_at.isoformat(),
        'updated_at': reservation.updated_at.isoformat()
    })

@api_v1_bp.route('/reservations', methods=['GET'])
def get_all_reservations():
    use_case = GetAllReservationsUseCase(get_repository())
    reservations = use_case.execute()
    
    return jsonify([{
        'id': r.id,
        'user_id': r.user_id,
        'event_id': r.event_id,
        'seat_number': r.seat_number,
        'status': r.status,
        'created_at': r.created_at.isoformat(),
        'updated_at': r.updated_at.isoformat()
    } for r in reservations])

@api_v1_bp.route('/reservations/<reservation_id>', methods=['PUT'])
def update_reservation(reservation_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    use_case = UpdateReservationUseCase(get_repository())
    reservation = use_case.execute(reservation_id, **data)
    
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    return jsonify({
        'id': reservation.id,
        'user_id': reservation.user_id,
        'event_id': reservation.event_id,
        'seat_number': reservation.seat_number,
        'status': reservation.status,
        'created_at': reservation.created_at.isoformat(),
        'updated_at': reservation.updated_at.isoformat()
    })

@api_v1_bp.route('/reservations/<reservation_id>', methods=['DELETE'])
def delete_reservation(reservation_id):
    use_case = DeleteReservationUseCase(get_repository())
    deleted = use_case.execute(reservation_id)
    
    if not deleted:
        return jsonify({'error': 'Reservation not found'}), 404
    
    return jsonify({'message': 'Reservation deleted successfully'})
