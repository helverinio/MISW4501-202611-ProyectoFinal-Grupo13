from types import SimpleNamespace

import app as app_module
import app.api.v1.auth as auth_module
import app.api.v1.comentarios_hoteles as comentarios_api
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


class FakeCreateComentarioUseCase:
    def execute(self, id_hotel, id_usuario, id_reserva, rating, comentario):
        return {
            'comentario': SimpleNamespace(
                id='comment-1',
                id_hotel=id_hotel,
                id_usuario=id_usuario,
                id_reserva=id_reserva,
                comentario=comentario,
                rating=rating,
                created_at=SimpleNamespace(isoformat=lambda: '2026-04-05T00:00:00'),
                updated_at=SimpleNamespace(isoformat=lambda: '2026-04-05T00:00:00'),
            ),
            'rating_hotel': {
                'rating_promedio': 4.2,
                'cantidad_ratings': 5,
                'cantidad_comentarios': 5,
            },
        }


class FakeListComentariosUseCase:
    def execute(self, hotel_id=None, page=1, per_page=10):
        return {
            'comentarios': [
                SimpleNamespace(
                    id='comment-1',
                    id_usuario='user-1',
                    id_reserva='res-1',
                    comentario='Excelente',
                    rating=5,
                    created_at=SimpleNamespace(isoformat=lambda: '2026-04-05T00:00:00'),
                    updated_at=SimpleNamespace(isoformat=lambda: '2026-04-05T00:00:00'),
                )
            ],
            'total': 1,
            'page': page,
            'per_page': per_page,
            'rating_hotel': {
                'rating_promedio': 4.2,
                'cantidad_ratings': 5,
                'cantidad_comentarios': 5,
            },
        }


class FakeGetRatingUseCase:
    def execute(self, _hotel_id):
        return {
            'rating_promedio': 3.0,
            'cantidad_ratings': 0,
            'cantidad_comentarios': 0,
        }


class FakeHotelRepository:
    def find_by_id(self, _hotel_id):
        return SimpleNamespace(id='hotel-1')


def patch_app_config(monkeypatch):
    monkeypatch.setattr(app_module, 'config', {'default': DummyConfig})


def test_comentarios_hoteles_endpoints(monkeypatch):
    patch_app_config(monkeypatch)
    monkeypatch.setattr(services_module, 'init_redis_lock_service', lambda _config: FakeHealthyRedisService())
    monkeypatch.setattr(auth_module, 'get_usuarios_auth_service', lambda: FakeAuthService())
    app_module.redis_lock_service = None

    monkeypatch.setattr(
        comentarios_api,
        '_build_services',
        lambda: (
            FakeCreateComentarioUseCase(),
            FakeListComentariosUseCase(),
            FakeGetRatingUseCase(),
            FakeHotelRepository(),
        ),
    )

    flask_app = app_module.create_app('default')
    client = flask_app.test_client()
    headers = {'Authorization': 'Bearer fake-token'}

    create_response = client.post(
        '/api/v1/hoteles/hotel-1/comentarios',
        headers=headers,
        json={'id_reserva': 'res-1', 'rating': 5, 'comentario': 'Excelente'},
    )
    assert create_response.status_code == 201
    assert create_response.get_json()['rating_hotel']['rating_promedio'] == 3.0

    list_response = client.get('/api/v1/hoteles/hotel-1/comentarios?page=1&per_page=10', headers=headers)
    assert list_response.status_code == 200
    assert list_response.get_json()['pagination']['total'] == 1

    rating_response = client.get('/api/v1/hoteles/hotel-1/rating', headers=headers)
    assert rating_response.status_code == 200
    assert rating_response.get_json()['rating_promedio'] == 3.0
