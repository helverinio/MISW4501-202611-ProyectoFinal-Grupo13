import logging
from typing import Optional, Dict, Any
from app.domain.entities.device_token import DeviceToken
from app.domain.repositories.device_token_repository import DeviceTokenRepository
from app.infrastructure.services.push_notification_service import PushNotificationService

logger = logging.getLogger(__name__)


class RegisterDeviceTokenUseCase:
    def __init__(self, repository: DeviceTokenRepository):
        self.repository = repository

    def execute(self, user_id: str, token: str, platform: str = 'expo') -> Dict[str, Any]:
        existing = self.repository.find_by_token(token)
        if existing:
            # Update user association if token already exists
            existing.user_id = user_id
            existing.platform = platform
            self.repository.update_token(existing)
            return {
                'id': existing.id,
                'user_id': existing.user_id,
                'token': existing.token,
                'platform': existing.platform,
                'message': 'Device token updated'
            }

        device_token = DeviceToken.create(user_id=user_id, token=token, platform=platform)
        saved = self.repository.save(device_token)
        return {
            'id': saved.id,
            'user_id': saved.user_id,
            'token': saved.token,
            'platform': saved.platform,
            'message': 'Device token registered'
        }


class UnregisterDeviceTokenUseCase:
    def __init__(self, repository: DeviceTokenRepository):
        self.repository = repository

    def execute(self, token: str) -> bool:
        return self.repository.delete_by_token(token)


class SendPushNotificationUseCase:
    def __init__(self, device_token_repository: DeviceTokenRepository,
                 push_service: PushNotificationService):
        self.device_token_repository = device_token_repository
        self.push_service = push_service

    def execute(self, user_id: str, title: str, body: str,
                data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        device_tokens = self.device_token_repository.find_by_user_id(user_id)
        if not device_tokens:
            logger.warning(f"[PUSH] No device tokens found for user {user_id}")
            return {'success': False, 'error': 'No device tokens found for user'}

        tokens = [dt.token for dt in device_tokens]
        logger.info(f"[PUSH] Sending notification to {len(tokens)} device(s) for user {user_id}")

        if len(tokens) == 1:
            return self.push_service.send_to_token(tokens[0], title, body, data)
        else:
            return self.push_service.send_to_tokens(tokens, title, body, data)


class SendPushNotificationToReservationUserUseCase:
    """Send a push notification to the user who owns a reservation."""

    def __init__(self, device_token_repository: DeviceTokenRepository,
                 push_service: PushNotificationService):
        self.device_token_repository = device_token_repository
        self.push_service = push_service

    def execute(self, reservation_id: str, title: str, body: str,
                data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        from app.infrastructure.models.reserva_model import ReservaModel

        reserva = ReservaModel.query.get(reservation_id)
        if not reserva:
            logger.warning(f"[PUSH] Reservation {reservation_id} not found")
            return {'success': False, 'error': 'Reservation not found'}

        user_id = reserva.id_usuario
        device_tokens = self.device_token_repository.find_by_user_id(user_id)
        if not device_tokens:
            logger.warning(f"[PUSH] No device tokens found for user {user_id} (reservation {reservation_id})")
            return {'success': False, 'error': 'No device tokens found for reservation user'}

        tokens = [dt.token for dt in device_tokens]
        notification_data = data or {}
        notification_data['reservation_id'] = reservation_id

        logger.info(f"[PUSH] Sending notification to user {user_id} for reservation {reservation_id}")

        if len(tokens) == 1:
            return self.push_service.send_to_token(tokens[0], title, body, notification_data)
        else:
            return self.push_service.send_to_tokens(tokens, title, body, notification_data)
