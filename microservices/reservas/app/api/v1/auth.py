import logging
from functools import wraps
from flask import request, jsonify
from app.infrastructure.services import get_usuarios_auth_service

logger = logging.getLogger(__name__)


def require_token(f):
    """
    Decorator to require a valid JWT token in the Authorization header.
    Validates the token against the Usuarios microservice.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning(f"[RESERVAS] Missing Authorization header for {request.method} {request.path}")
            return jsonify({'error': 'Authorization header is required'}), 401

        # Parse Authorization header
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            logger.warning(f"[RESERVAS] Invalid Authorization header format for {request.method} {request.path}")
            return jsonify({'error': 'Invalid authorization header format. Use "Bearer <token>"'}), 401

        access_token = parts[1]

        # Validate token with usuarios service
        try:
            auth_service = get_usuarios_auth_service()
            usuario_data = auth_service.validate_token(access_token)

            if not usuario_data:
                logger.warning(f"[RESERVAS] Invalid or expired token for {request.method} {request.path}")
                return jsonify({'error': 'Invalid or expired token'}), 401
        except Exception as e:
            logger.error(f"[RESERVAS] Error validating token: {str(e)}")
            return jsonify({'error': 'Token validation failed'}), 401

        # Add usuario data to kwargs so the endpoint can access it
        kwargs['current_usuario'] = usuario_data

        logger.info(f"[RESERVAS] Token validated for user {usuario_data.get('usuario')} - {request.method} {request.path}")
        return f(*args, **kwargs)

    return decorated_function
