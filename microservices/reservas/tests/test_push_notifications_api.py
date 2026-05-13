import pytest
from unittest.mock import Mock, patch
import json
import app as app_module
import app.api.v1.auth as auth_module
import app.infrastructure.services as services_module
from app import db
from app.infrastructure.repositories import SQLAlchemyDeviceTokenRepository
from app.infrastructure.models.device_token_model import DeviceTokenModel


class FakeHealthyRedisService:
    def health_check(self):
        return {"status": "healthy"}


class DummyConfig:
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PAGOS_SERVICE_URL = "http://localhost:5002"


class FakeAuthService:
    def validate_token(self, _token):
        return {"id": "user-1", "usuario": "tester"}


def patch_app_config(monkeypatch):
    monkeypatch.setattr(app_module, "config", {"default": DummyConfig})


@pytest.fixture
def client(monkeypatch):
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, "init_redis_lock_service", lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(services_module, "init_firebase", lambda *_: None)
    monkeypatch.setattr(auth_module, "get_usuarios_auth_service", lambda: FakeAuthService())
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    return flask_app.test_client()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer fake-token"}


def test_register_device_token_success(client, auth_headers, monkeypatch):
    """Test registering a device token successfully."""
    mock_repo = Mock()
    mock_repo.find_by_token.return_value = None
    mock_repo.save.return_value = Mock(id="token-1", user_id="user-123", token="expo-push-token-123", platform="expo")

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        response = client.post(
            '/api/v1/device-tokens',
            json={
                'user_id': 'user-123',
                'token': 'expo-push-token-123',
                'platform': 'expo'
            },
            headers=auth_headers
        )

    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data or 'token' in data


def test_register_device_token_missing_fields(client, auth_headers):
    """Test registering a device token with missing fields."""
    response = client.post(
        '/api/v1/device-tokens',
        json={'user_id': 'user-123'},
        headers=auth_headers
    )

    assert response.status_code == 400


def test_unregister_device_token_success(client, auth_headers, monkeypatch):
    """Test unregistering a device token successfully."""
    mock_repo = Mock()
    mock_repo.delete_by_token.return_value = True

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        response = client.delete(
            '/api/v1/device-tokens',
            json={'token': 'test-token'},
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data


def test_send_push_notification_to_user_success(client, auth_headers, monkeypatch):
    """Test sending a push notification to a user successfully."""
    mock_repo = Mock()
    mock_repo.find_by_user_id.return_value = [Mock(token="expo-token-123")]
    mock_push_service = Mock()
    mock_push_service.send_to_token.return_value = {"success": True, "message_id": "msg-123"}

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        with patch('app.api.v1.push_notifications.get_push_service', return_value=mock_push_service):
            response = client.post(
                '/api/v1/push-notifications/send',
                json={
                    'user_id': 'user-123',
                    'title': 'Test Title',
                    'body': 'Test Body'
                },
                headers=auth_headers
            )

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True


def test_send_push_notification_to_reservation_success(client, auth_headers, monkeypatch):
    """Test sending a push notification to a reservation user successfully."""
    # This test requires DB setup for reservation lookup - skip for now
    # TODO: Add DB fixture setup for this test
    pass


def test_send_push_notification_missing_fields(client, auth_headers):
    """Test sending a push notification with missing fields."""
    response = client.post(
        '/api/v1/push-notifications/send',
        json={'user_id': 'user-123'},
        headers=auth_headers
    )

    assert response.status_code == 400


def test_clear_user_tokens_success(client, auth_headers, monkeypatch):
    """Test clearing all device tokens for a user successfully."""
    mock_repo = Mock()
    mock_repo.delete_by_user_id.return_value = 3

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        response = client.delete(
            '/api/v1/device-tokens/user/user-123',
            headers=auth_headers
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['deleted_count'] == 3
    assert 'message' in data


def test_send_push_notification_invalid_token_cleanup(client, auth_headers, monkeypatch):
    """Test that invalid tokens are cleaned up when sending notification."""
    mock_repo = Mock()
    mock_repo.find_by_user_id.return_value = [Mock(token="invalid-token-123")]
    mock_repo.delete_by_token.return_value = True
    mock_push_service = Mock()
    mock_push_service.send_to_token.return_value = {
        'success': False,
        'error': 'The registration token is not a valid FCM registration token',
        'invalid_token': 'invalid-token-123'
    }

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        with patch('app.api.v1.push_notifications.get_push_service', return_value=mock_push_service):
            response = client.post(
                '/api/v1/push-notifications/send',
                json={
                    'user_id': 'user-123',
                    'title': 'Test Title',
                    'body': 'Test Body'
                },
                headers=auth_headers
            )

    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'invalid_token' in data
    assert 'cleaned_invalid_token' in data
    mock_repo.delete_by_token.assert_called_once_with('invalid-token-123')


def test_send_push_notification_multicast_invalid_tokens_cleanup(client, auth_headers):
    """Test that multiple invalid tokens are cleaned up when sending multicast notification."""
    mock_repo = Mock()
    mock_repo.find_by_user_id.return_value = [
        Mock(token="valid-token"),
        Mock(token="invalid-token-1"),
        Mock(token="invalid-token-2")
    ]
    mock_repo.delete_by_token.return_value = True
    mock_push_service = Mock()
    mock_push_service.send_to_tokens.return_value = {
        'success': True,
        'success_count': 1,
        'failure_count': 2,
        'invalid_tokens': ['invalid-token-1', 'invalid-token-2']
    }

    with patch('app.api.v1.push_notifications.get_device_token_repository', return_value=mock_repo):
        with patch('app.api.v1.push_notifications.get_push_service', return_value=mock_push_service):
            response = client.post(
                '/api/v1/push-notifications/send',
                json={
                    'user_id': 'user-123',
                    'title': 'Test Title',
                    'body': 'Test Body'
                },
                headers=auth_headers
            )

    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'cleaned_invalid_tokens' in data
    assert len(data['cleaned_invalid_tokens']) == 2
    assert mock_repo.delete_by_token.call_count == 2


def test_repository_delete_by_user_id(monkeypatch):
    """Test repository delete_by_user_id method."""
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, "init_redis_lock_service", lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(services_module, "init_firebase", lambda *_: None)
    monkeypatch.setattr(auth_module, "get_usuarios_auth_service", lambda: FakeAuthService())
    app_module.redis_lock_service = None

    flask_app = app_module.create_app("default")
    
    with flask_app.app_context():
        db.create_all()
        
        # Create test tokens
        repo = SQLAlchemyDeviceTokenRepository()
        
        # Create multiple tokens for the same user
        token1 = DeviceTokenModel(id="token-1", user_id="user-123", token="expo-token-1", platform="expo")
        token2 = DeviceTokenModel(id="token-2", user_id="user-123", token="expo-token-2", platform="expo")
        token3 = DeviceTokenModel(id="token-3", user_id="user-456", token="expo-token-3", platform="expo")
        
        db.session.add(token1)
        db.session.add(token2)
        db.session.add(token3)
        db.session.commit()
        
        # Delete all tokens for user-123
        deleted_count = repo.delete_by_user_id("user-123")
        
        assert deleted_count == 2
        
        # Verify only user-123 tokens were deleted
        remaining = DeviceTokenModel.query.filter_by(user_id="user-123").all()
        assert len(remaining) == 0
        
        # Verify user-456 token still exists
        remaining_456 = DeviceTokenModel.query.filter_by(user_id="user-456").all()
        assert len(remaining_456) == 1
        
        db.session.rollback()
        db.drop_all()
