import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase(credentials_path: Optional[str] = None):
    """Initialize Firebase Admin SDK. Call once at app startup."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials as fb_credentials

        if credentials_path:
            cred = fb_credentials.Certificate(credentials_path)
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            # Uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
            _firebase_app = firebase_admin.initialize_app()

        logger.info("[PUSH] Firebase Admin SDK initialized successfully")
        return _firebase_app
    except Exception as e:
        logger.warning(f"[PUSH] Could not initialize Firebase Admin SDK: {str(e)}")
        return None


class PushNotificationService:
    """Service to send push notifications via Firebase Cloud Messaging (FCM)."""

    def send_to_token(self, token: str, title: str, body: str,
                      data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a push notification to a single device token."""
        try:
            from firebase_admin import messaging

            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                token=token,
            )

            response = messaging.send(message)
            logger.info(f"[PUSH] Notification sent successfully: {response}")
            return {'success': True, 'message_id': response}

        except Exception as e:
            logger.error(f"[PUSH] Failed to send notification to token: {str(e)}")
            return {'success': False, 'error': str(e)}

    def send_to_tokens(self, tokens: List[str], title: str, body: str,
                       data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a push notification to multiple device tokens."""
        if not tokens:
            return {'success': False, 'error': 'No tokens provided'}

        try:
            from firebase_admin import messaging

            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=tokens,
            )

            response = messaging.send_each_for_multicast(message)
            logger.info(
                f"[PUSH] Multicast sent: {response.success_count} success, "
                f"{response.failure_count} failures"
            )
            return {
                'success': True,
                'success_count': response.success_count,
                'failure_count': response.failure_count,
            }

        except Exception as e:
            logger.error(f"[PUSH] Failed to send multicast notification: {str(e)}")
            return {'success': False, 'error': str(e)}
