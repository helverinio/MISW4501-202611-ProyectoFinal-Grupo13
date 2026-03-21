from flask import Flask
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    from app.api.v1 import api_v1_bp
    app.register_blueprint(api_v1_bp, url_prefix='/api/v1')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'gateway'}
    
    return app
