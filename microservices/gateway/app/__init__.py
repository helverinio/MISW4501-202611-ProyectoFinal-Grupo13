from flask import Flask
from flask_cors import CORS
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    CORS(
        app,
        resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}},
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Request-Id'],
        expose_headers=['Content-Type', 'X-Request-Id'],
        supports_credentials=True,
        max_age=600,
    )
    
    from app.api.v1 import api_v1_bp
    app.register_blueprint(api_v1_bp, url_prefix='/api/v1')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'gateway'}
    
    return app
