import app as app_module
import app.api.v1.auth as auth_module
import app.api.v1.hoteles as hoteles_api
import app.infrastructure.services as services_module


class FakeHealthyRedisService:
    def health_check(self):
        return {'status': 'healthy'}


class DummyConfig:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PAGOS_SERVICE_URL = 'http://localhost:5002'


class FakeAuthService:
    def validate_token(self, _token):
        return {'id': 'user-1', 'usuario': 'tester'}


class FakePopularDestinationsUseCase:
    def execute(self, limit=4):
        return [
            {
                'ciudad': 'Bogota',
                'pais': 'Colombia',
                'id_ciudad': 'c1',
                'hotel_id': 'h1',
                'hotel_nombre': 'Marriott Bogota',
                'rating_promedio': 4.8,
                'cantidad_ratings': 120,
                'precio_minimo_noche': 95.0,
                'moneda': 'USD',
                'hoteles_disponibles_ciudad': 11,
            }
        ][:limit]


def patch_app_config(monkeypatch):
    monkeypatch.setattr(app_module, 'config', {'default': DummyConfig})


def test_hoteles_populares_por_ciudad_endpoint(monkeypatch):
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, 'init_redis_lock_service', lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(auth_module, 'get_usuarios_auth_service', lambda: FakeAuthService())
    app_module.redis_lock_service = None

    monkeypatch.setattr(
        hoteles_api,
        'get_popular_destinations_use_case',
        lambda: FakePopularDestinationsUseCase(),
    )

    flask_app = app_module.create_app('default')
    client = flask_app.test_client()
    headers = {'Authorization': 'Bearer fake-token'}

    response = client.get('/api/v1/hoteles/populares-por-ciudad?limit=4', headers=headers)

    assert response.status_code == 200
    body = response.get_json()
    assert body['total_ciudades'] == 1
    assert body['destinos'][0]['hotel_nombre'] == 'Marriott Bogota'
