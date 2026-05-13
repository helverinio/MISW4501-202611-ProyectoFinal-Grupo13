import logging
import json
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase(credentials_path: Optional[str] = None, credentials_json: Optional[str] = None):
    """Initialize Firebase Admin SDK. Call once at app startup.
    
    Args:
        credentials_path: Path to the service account JSON file
        credentials_json: Service account credentials as a JSON string
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials as fb_credentials

        if credentials_json:
            # Parse JSON string and initialize with dict
            cred_dict = json.loads(credentials_json)
            cred = fb_credentials.Certificate(cred_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
        elif credentials_path:
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
            error_str = str(e)
            logger.error(f"[PUSH] Failed to send notification to token: {error_str}")
            
            # Check if this is an invalid token error
            if 'InvalidRegistrationToken' in error_str or 'registration token is not a valid' in error_str.lower():
                return {'success': False, 'error': error_str, 'invalid_token': token}
            
            return {'success': False, 'error': error_str}

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
            
            # Extract invalid tokens from the response
            invalid_tokens = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    exception = resp.exception
                    if exception and ('InvalidRegistrationToken' in str(exception) or 
                                      'registration token is not a valid' in str(exception).lower()):
                        invalid_tokens.append(tokens[idx])
            
            result = {
                'success': True,
                'success_count': response.success_count,
                'failure_count': response.failure_count,
            }
            
            if invalid_tokens:
                result['invalid_tokens'] = invalid_tokens
                
            return result

        except Exception as e:
            logger.error(f"[PUSH] Failed to send multicast notification: {str(e)}")
            return {'success': False, 'error': str(e)}
