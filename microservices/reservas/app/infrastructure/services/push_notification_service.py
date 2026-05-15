import logging
import json
import requests
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

_firebase_app = None
EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"


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
    """Service to send push notifications via Firebase Cloud Messaging (FCM) or Expo Push API."""

    def _is_expo_token(self, token: str) -> bool:
        """Check if the token is an Expo push token."""
        return token.startswith('ExponentPushToken[') or token.startswith('ExpoPushToken[')

    def _send_via_expo(self, token: str, title: str, body: str,
                      data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a push notification via Expo Push API."""
        try:
            payload = {
                'to': token,
                'title': title,
                'body': body,
                'data': data or {},
                'sound': 'default',
            }

            response = requests.post(
                EXPO_PUSH_API_URL,
                json=payload,
                headers={'Accept': 'application/json', 'Content-Type': 'application/json'},
                timeout=10
            )

            response_data = response.json()

            if response.status_code == 200 and response_data.get('data'):
                # Check if there were any errors in the Expo response
                expo_data = response_data['data']
                # Single-token requests return a dict; batch requests return a list
                if isinstance(expo_data, dict):
                    expo_data = [expo_data]
                if isinstance(expo_data, list) and len(expo_data) > 0:
                    first_item = expo_data[0]
                    if first_item.get('status') == 'ok':
                        logger.info(f"[PUSH] Expo notification sent successfully: {first_item.get('id')}")
                        return {'success': True, 'message_id': first_item.get('id')}
                    elif first_item.get('status') == 'error':
                        error = first_item.get('message', 'Unknown error')
                        logger.error(f"[PUSH] Expo notification failed: {error}")
                        # Check if it's an invalid token error
                        if 'DeviceNotRegistered' in error or 'InvalidCredentials' in error:
                            return {'success': False, 'error': error, 'invalid_token': token}
                        return {'success': False, 'error': error}

            logger.error(f"[PUSH] Expo API returned unexpected response: {response_data}")
            return {'success': False, 'error': f'Unexpected Expo response: {response_data}'}

        except requests.RequestException as e:
            logger.error(f"[PUSH] Failed to send Expo notification: {str(e)}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"[PUSH] Unexpected error sending Expo notification: {str(e)}")
            return {'success': False, 'error': str(e)}

    def send_to_token(self, token: str, title: str, body: str,
                      data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a push notification to a single device token."""
        # Route Expo tokens to Expo Push API
        if self._is_expo_token(token):
            return self._send_via_expo(token, title, body, data)

        # Send via FCM for non-Expo tokens
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

        # Separate Expo and FCM tokens
        expo_tokens = [t for t in tokens if self._is_expo_token(t)]
        fcm_tokens = [t for t in tokens if not self._is_expo_token(t)]

        success_count = 0
        failure_count = 0
        invalid_tokens = []
        errors = []

        # Send to Expo tokens
        if expo_tokens:
            for token in expo_tokens:
                result = self._send_via_expo(token, title, body, data)
                if result.get('success'):
                    success_count += 1
                else:
                    failure_count += 1
                    if result.get('invalid_token'):
                        invalid_tokens.append(token)
                    if result.get('error'):
                        errors.append(f"Expo token {token}: {result['error']}")

        # Send to FCM tokens
        if fcm_tokens:
            try:
                from firebase_admin import messaging

                message = messaging.MulticastMessage(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    data=data or {},
                    tokens=fcm_tokens,
                )

                response = messaging.send_each_for_multicast(message)
                logger.info(
                    f"[PUSH] FCM Multicast sent: {response.success_count} success, "
                    f"{response.failure_count} failures"
                )

                success_count += response.success_count
                failure_count += response.failure_count

                # Extract invalid tokens from the response
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        exception = resp.exception
                        if exception and ('InvalidRegistrationToken' in str(exception) or
                                          'registration token is not a valid' in str(exception).lower()):
                            invalid_tokens.append(fcm_tokens[idx])

            except Exception as e:
                logger.error(f"[PUSH] Failed to send FCM multicast notification: {str(e)}")
                failure_count += len(fcm_tokens)
                errors.append(f"FCM multicast error: {str(e)}")

        result = {
            'success': success_count > 0,
            'success_count': success_count,
            'failure_count': failure_count,
        }

        if invalid_tokens:
            result['invalid_tokens'] = invalid_tokens

        if errors:
            result['errors'] = errors

        return result
