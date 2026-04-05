from datetime import datetime

import pytest

from app.application.use_cases.comentario_hotel_use_cases import (
    CreateComentarioHotelUseCase,
    GetHotelRatingSummaryUseCase,
    ListComentariosHotelUseCase,
    RatingAggregationService,
)


class FakeComentarioRepository:
    def __init__(self):
        self.saved = []
        self.exists_duplicate = False
        self.reserva_valid = True
        self.summary = {
            'rating_promedio': 4.5,
            'cantidad_ratings': 2,
            'cantidad_comentarios': 2,
        }

    def save(self, comentario):
        self.saved.append(comentario)
        return comentario

    def exists_by_usuario_and_reserva(self, id_usuario, id_reserva):
        return self.exists_duplicate

    def reserva_belongs_to_hotel_and_usuario(self, id_reserva, id_hotel, id_usuario):
        return self.reserva_valid

    def find_by_hotel_paginated(self, id_hotel, page, per_page):
        return self.saved, len(self.saved)

    def get_rating_summary(self, id_hotel):
        return self.summary

    def get_rating_summaries_by_hoteles(self, hotel_ids):
        return {
            hotel_id: self.summary
            for hotel_id in hotel_ids
        }


def test_rating_aggregation_service_returns_default_when_no_ratings():
    repo = FakeComentarioRepository()
    repo.summary = {
        'rating_promedio': None,
        'cantidad_ratings': 0,
        'cantidad_comentarios': 0,
    }

    service = RatingAggregationService(repo)
    result = service.get_hotel_rating_summary('hotel-1')

    assert result['rating_promedio'] == 3.0
    assert result['cantidad_ratings'] == 0
    assert result['cantidad_comentarios'] == 0


def test_create_comentario_use_case_creates_comment_and_returns_updated_summary():
    repo = FakeComentarioRepository()
    rating_service = RatingAggregationService(repo)
    use_case = CreateComentarioHotelUseCase(repo, rating_service)

    result = use_case.execute(
        id_hotel='hotel-1',
        id_usuario='user-1',
        id_reserva='res-1',
        rating=5,
        comentario='Excelente estadia',
    )

    assert len(repo.saved) == 1
    assert result['comentario'].rating == 5
    assert result['comentario'].created_at <= datetime.utcnow()
    assert result['rating_hotel']['rating_promedio'] == 4.5


@pytest.mark.parametrize('invalid_rating', [0, 6, 2.5, '4'])
def test_create_comentario_use_case_rejects_invalid_rating(invalid_rating):
    repo = FakeComentarioRepository()
    rating_service = RatingAggregationService(repo)
    use_case = CreateComentarioHotelUseCase(repo, rating_service)

    with pytest.raises(ValueError, match='rating debe ser un entero entre 1 y 5'):
        use_case.execute(
            id_hotel='hotel-1',
            id_usuario='user-1',
            id_reserva='res-1',
            rating=invalid_rating,
            comentario='x',
        )


def test_create_comentario_use_case_rejects_duplicate_per_reservation():
    repo = FakeComentarioRepository()
    repo.exists_duplicate = True
    rating_service = RatingAggregationService(repo)
    use_case = CreateComentarioHotelUseCase(repo, rating_service)

    with pytest.raises(ValueError, match='Ya existe una reseña para esta reserva y usuario'):
        use_case.execute(
            id_hotel='hotel-1',
            id_usuario='user-1',
            id_reserva='res-1',
            rating=5,
            comentario='x',
        )


def test_create_comentario_use_case_requires_valid_reservation():
    repo = FakeComentarioRepository()
    repo.reserva_valid = False
    rating_service = RatingAggregationService(repo)
    use_case = CreateComentarioHotelUseCase(repo, rating_service)

    with pytest.raises(ValueError, match='La reserva no pertenece al hotel o al usuario'):
        use_case.execute(
            id_hotel='hotel-1',
            id_usuario='user-1',
            id_reserva='res-1',
            rating=5,
            comentario='x',
        )


def test_list_comentarios_use_case_returns_paginated_result():
    repo = FakeComentarioRepository()
    rating_service = RatingAggregationService(repo)
    create_use_case = CreateComentarioHotelUseCase(repo, rating_service)
    create_use_case.execute('hotel-1', 'user-1', 'res-1', 5, 'Muy bien')

    use_case = ListComentariosHotelUseCase(repo, rating_service)
    result = use_case.execute('hotel-1', page=1, per_page=10)

    assert result['total'] == 1
    assert len(result['comentarios']) == 1
    assert result['rating_hotel']['rating_promedio'] == 4.5


def test_list_comentarios_use_case_validates_page_and_per_page():
    repo = FakeComentarioRepository()
    rating_service = RatingAggregationService(repo)
    use_case = ListComentariosHotelUseCase(repo, rating_service)

    with pytest.raises(ValueError, match='page debe ser mayor o igual a 1'):
        use_case.execute('hotel-1', page=0, per_page=10)

    with pytest.raises(ValueError, match='per_page debe estar entre 1 y 100'):
        use_case.execute('hotel-1', page=1, per_page=101)


def test_get_hotel_rating_summary_use_case_delegates_to_service():
    repo = FakeComentarioRepository()
    rating_service = RatingAggregationService(repo)
    use_case = GetHotelRatingSummaryUseCase(rating_service)

    result = use_case.execute('hotel-1')

    assert result['rating_promedio'] == 4.5
    assert result['cantidad_ratings'] == 2
    assert result['cantidad_comentarios'] == 2
