from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app.application.use_cases import (
    RegisterDeviceTokenUseCase,
    UnregisterDeviceTokenUseCase,
    SendPushNotificationUseCase,
    SendPushNotificationToReservationUserUseCase,
)
from app.infrastructure.repositories import SQLAlchemyDeviceTokenRepository
from app.infrastructure.services import PushNotificationService


def get_device_token_repository():
    return SQLAlchemyDeviceTokenRepository()


def get_push_service():
    return PushNotificationService()


@api_v1_bp.route('/device-tokens/<user_id>', methods=['GET'])
@require_token
def get_device_tokens(user_id, current_usuario=None):
    repo = get_device_token_repository()
    tokens = repo.find_by_user_id(user_id)
    return jsonify([
        {
            'id': t.id,
            'user_id': t.user_id,
            'token': t.token,
            'platform': t.platform,
            'created_at': t.created_at.isoformat() if t.created_at else None,
        }
        for t in tokens
    ])


@api_v1_bp.route('/device-tokens', methods=['POST'])
@require_token
def register_device_token(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    token = data.get('token')
    platform = data.get('platform', 'expo')
    user_id = data.get('user_id')

    if not token or not user_id:
        return jsonify({'error': 'token and user_id are required'}), 400

    use_case = RegisterDeviceTokenUseCase(get_device_token_repository())
    result = use_case.execute(user_id, token, platform)

    return jsonify(result), 201


@api_v1_bp.route('/device-tokens', methods=['DELETE'])
@require_token
def unregister_device_token(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    token = data.get('token')
    if not token:
        return jsonify({'error': 'token is required'}), 400

    use_case = UnregisterDeviceTokenUseCase(get_device_token_repository())
    deleted = use_case.execute(token)

    if not deleted:
        return jsonify({'error': 'Token not found'}), 404

    return jsonify({'message': 'Device token removed successfully'})


@api_v1_bp.route('/push-notifications/send', methods=['POST'])
@require_token
def send_push_notification(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user_id = data.get('user_id')
    title = data.get('title')
    body = data.get('body')
    extra_data = data.get('data', {})

    if not user_id or not title or not body:
        return jsonify({'error': 'user_id, title, and body are required'}), 400

    use_case = SendPushNotificationUseCase(
        get_device_token_repository(),
        get_push_service()
    )
    result = use_case.execute(user_id, title, body, extra_data)

    if not result.get('success'):
        return jsonify(result), 400

    return jsonify(result)


@api_v1_bp.route('/push-notifications/send-to-reservation', methods=['POST'])
@require_token
def send_push_notification_to_reservation(current_usuario=None):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    reservation_id = data.get('reservation_id')
    title = data.get('title')
    body = data.get('body')
    extra_data = data.get('data', {})

    if not reservation_id or not title or not body:
        return jsonify({'error': 'reservation_id, title, and body are required'}), 400

    use_case = SendPushNotificationToReservationUserUseCase(
        get_device_token_repository(),
        get_push_service()
    )
    result = use_case.execute(reservation_id, title, body, extra_data)

    if not result.get('success'):
        return jsonify(result), 400

    return jsonify(result)
