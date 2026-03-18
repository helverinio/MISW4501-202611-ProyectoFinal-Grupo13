from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.application.use_cases import (
    AcquireRoomHoldUseCase,
    CheckRoomHoldUseCase,
    CleanupExpiredHoldsUseCase,
    CreateCiudadUseCase,
    CreateEstadoUseCase,
    CreateHabitacionUseCase,
    CreateHotelUseCase,
    CreateNotificacionUseCase,
    CreatePagoUseCase,
    CreatePaisUseCase,
    CreateReservaUseCase,
    CreateTarifaUseCase,
    DeleteCiudadUseCase,
    DeleteEstadoUseCase,
    DeleteHabitacionUseCase,
    DeleteHotelUseCase,
    DeleteNotificacionUseCase,
    DeletePagoUseCase,
    DeletePaisUseCase,
    DeleteReservaUseCase,
    DeleteTarifaUseCase,
    GetAllCiudadesUseCase,
    GetAllEstadosUseCase,
    GetAllHabitacionesUseCase,
    GetAllHotelesUseCase,
    GetAllNotificacionesUseCase,
    GetAllPagosUseCase,
    GetAllPaisesUseCase,
    GetAllReservasUseCase,
    GetAllTarifasUseCase,
    GetCiudadUseCase,
    GetCiudadesByPaisUseCase,
    GetEstadoUseCase,
    GetHabitacionUseCase,
    GetHabitacionesByHotelUseCase,
    GetHotelUseCase,
    GetHotelesByCiudadUseCase,
    GetNotificacionUseCase,
    GetNotificacionesByReservaUseCase,
    GetPagoUseCase,
    GetPagosByReservaUseCase,
    GetPaisUseCase,
    GetReservaUseCase,
    GetReservasByHabitacionUseCase,
    GetReservasByUsuarioUseCase,
    GetRoomHoldUseCase,
    GetTarifaUseCase,
    GetTarifasByHabitacionUseCase,
    ReleaseRoomHoldUseCase,
    UpdateCiudadUseCase,
    UpdateEstadoUseCase,
    UpdateHabitacionUseCase,
    UpdateHotelUseCase,
    UpdateNotificacionUseCase,
    UpdatePagoUseCase,
    UpdatePaisUseCase,
    UpdateReservaUseCase,
    UpdateTarifaUseCase,
    ValidateUserHoldUseCase,
)


@pytest.mark.parametrize(
    "use_case_cls,args",
    [
        (CreatePaisUseCase, ("Colombia",)),
        (CreateCiudadUseCase, ("Bogota", "pais-1")),
        (CreateHotelUseCase, ("Hotel 1", "hotel@mail.com", "ciudad-1", "Desc", "Spa")),
        (CreateHabitacionUseCase, ("Suite", 101, 2, 1, "hotel-1")),
        (CreateTarifaUseCase, ("Flexible", 100.0, 5.0, "hab-1")),
        (CreateEstadoUseCase, ("Confirmada", "Pago recibido")),
        (CreateReservaUseCase, (datetime.utcnow(), datetime.utcnow() + timedelta(days=1), 300.0, 2, "u-1", "pais-1", "hab-1", "estado-1")),
        (CreatePagoUseCase, (datetime.utcnow(), 300.0, "completado", "pais-1", "reserva-1")),
        (CreateNotificacionUseCase, (datetime.utcnow(), "Titulo", "reserva-1", "Descripcion")),
    ],
)
def test_create_use_cases_delegate_to_repository_save(use_case_cls, args):
    repo = Mock()
    repo.save.side_effect = lambda obj: obj

    result = use_case_cls(repo).execute(*args)

    assert result is not None
    repo.save.assert_called_once()


@pytest.mark.parametrize(
    "use_case_cls,repo_method,arg",
    [
        (GetPaisUseCase, "find_by_id", "pais-1"),
        (GetCiudadUseCase, "find_by_id", "ciudad-1"),
        (GetHotelUseCase, "find_by_id", "hotel-1"),
        (GetHabitacionUseCase, "find_by_id", "hab-1"),
        (GetTarifaUseCase, "find_by_id", "tarifa-1"),
        (GetEstadoUseCase, "find_by_id", "estado-1"),
        (GetReservaUseCase, "find_by_id", "reserva-1"),
        (GetPagoUseCase, "find_by_id", "pago-1"),
        (GetNotificacionUseCase, "find_by_id", "notif-1"),
        (GetRoomHoldUseCase, "find_by_id", "hold-1"),
        (GetAllPaisesUseCase, "find_all", None),
        (GetAllCiudadesUseCase, "find_all", None),
        (GetAllHotelesUseCase, "find_all", None),
        (GetAllHabitacionesUseCase, "find_all", None),
        (GetAllTarifasUseCase, "find_all", None),
        (GetAllEstadosUseCase, "find_all", None),
        (GetAllReservasUseCase, "find_all", None),
        (GetAllPagosUseCase, "find_all", None),
        (GetAllNotificacionesUseCase, "find_all", None),
        (GetCiudadesByPaisUseCase, "find_by_pais", "pais-1"),
        (GetHotelesByCiudadUseCase, "find_by_ciudad", "ciudad-1"),
        (GetHabitacionesByHotelUseCase, "find_by_hotel", "hotel-1"),
        (GetTarifasByHabitacionUseCase, "find_by_habitacion", "hab-1"),
        (GetReservasByUsuarioUseCase, "find_by_usuario", "user-1"),
        (GetReservasByHabitacionUseCase, "find_by_habitacion", "hab-1"),
        (GetPagosByReservaUseCase, "find_by_reserva", "reserva-1"),
        (GetNotificacionesByReservaUseCase, "find_by_reserva", "reserva-1"),
    ],
)
def test_get_use_cases_delegate_to_repository(use_case_cls, repo_method, arg):
    repo = Mock()
    setattr(repo, repo_method, Mock(return_value=["ok"] if repo_method == "find_all" else "ok"))

    use_case = use_case_cls(repo)
    result = use_case.execute() if arg is None else use_case.execute(arg)

    assert result is not None
    getattr(repo, repo_method).assert_called_once_with() if arg is None else getattr(repo, repo_method).assert_called_once_with(arg)


@pytest.mark.parametrize(
    "use_case_cls,initial_obj,updates,expected",
    [
        (UpdatePaisUseCase, SimpleNamespace(nombre="old"), {"nombre": "new"}, {"nombre": "new"}),
        (UpdateCiudadUseCase, SimpleNamespace(nombre="old", id_pais="p1"), {"nombre": "new", "id_pais": "p2"}, {"nombre": "new", "id_pais": "p2"}),
        (UpdateHotelUseCase, SimpleNamespace(nombre="a", email="a@a.com", descripcion="d", amenidades="x", id_ciudad="c1"), {"nombre": "b", "email": "b@a.com", "descripcion": "d2", "amenidades": "y", "id_ciudad": "c2"}, {"nombre": "b", "email": "b@a.com", "descripcion": "d2", "amenidades": "y", "id_ciudad": "c2"}),
        (UpdateHabitacionUseCase, SimpleNamespace(tipo="std", nro_habitacion=1, capacidad=2, camas=1, id_hotel="h1"), {"tipo": "suite", "nro_habitacion": 2, "capacidad": 3, "camas": 2, "id_hotel": "h2"}, {"tipo": "suite", "nro_habitacion": 2, "capacidad": 3, "camas": 2, "id_hotel": "h2"}),
        (UpdateTarifaUseCase, SimpleNamespace(nombre="n", valor=1.0, descuento=0.0, id_habitacion="h1"), {"nombre": "n2", "valor": 2.0, "descuento": 1.0, "id_habitacion": "h2"}, {"nombre": "n2", "valor": 2.0, "descuento": 1.0, "id_habitacion": "h2"}),
        (UpdateEstadoUseCase, SimpleNamespace(nombre="n", descripcion="d"), {"nombre": "n2", "descripcion": "d2"}, {"nombre": "n2", "descripcion": "d2"}),
        (UpdateReservaUseCase, SimpleNamespace(fecha_ingreso=datetime(2026, 1, 1), fecha_salida=datetime(2026, 1, 2), total=10.0, nro_personas=1, id_usuario="u", id_pais="p", id_habitacion="h", id_estado="e"), {"total": 20.0, "nro_personas": 3, "id_usuario": "u2", "id_pais": "p2", "id_habitacion": "h2", "id_estado": "e2"}, {"total": 20.0, "nro_personas": 3, "id_usuario": "u2", "id_pais": "p2", "id_habitacion": "h2", "id_estado": "e2"}),
        (UpdatePagoUseCase, SimpleNamespace(fecha_pago=datetime(2026, 1, 1), total=10.0, estado="pendiente", id_pais="p1", id_reserva="r1"), {"total": 99.0, "estado": "completado", "id_pais": "p2", "id_reserva": "r2"}, {"total": 99.0, "estado": "completado", "id_pais": "p2", "id_reserva": "r2"}),
        (UpdateNotificacionUseCase, SimpleNamespace(fecha_notif=datetime(2026, 1, 1), titulo="t1", descripcion="d1", id_reserva="r1"), {"titulo": "t2", "descripcion": "d2", "id_reserva": "r2"}, {"titulo": "t2", "descripcion": "d2", "id_reserva": "r2"}),
    ],
)
def test_update_use_cases_mutate_and_persist(use_case_cls, initial_obj, updates, expected):
    repo = Mock()
    repo.find_by_id.return_value = initial_obj
    repo.update.return_value = initial_obj

    result = use_case_cls(repo).execute("any-id", **updates)

    assert result is initial_obj
    for key, expected_value in expected.items():
        assert getattr(initial_obj, key) == expected_value
    repo.update.assert_called_once_with(initial_obj)


@pytest.mark.parametrize(
    "use_case_cls",
    [
        UpdatePaisUseCase,
        UpdateCiudadUseCase,
        UpdateHotelUseCase,
        UpdateHabitacionUseCase,
        UpdateTarifaUseCase,
        UpdateEstadoUseCase,
        UpdateReservaUseCase,
        UpdatePagoUseCase,
        UpdateNotificacionUseCase,
    ],
)
def test_update_use_cases_return_none_when_entity_missing(use_case_cls):
    repo = Mock()
    repo.find_by_id.return_value = None

    result = use_case_cls(repo).execute("missing-id", nombre="unused")

    assert result is None
    repo.update.assert_not_called()


@pytest.mark.parametrize(
    "use_case_cls",
    [
        DeletePaisUseCase,
        DeleteCiudadUseCase,
        DeleteHotelUseCase,
        DeleteHabitacionUseCase,
        DeleteTarifaUseCase,
        DeleteEstadoUseCase,
        DeleteReservaUseCase,
        DeletePagoUseCase,
        DeleteNotificacionUseCase,
        ReleaseRoomHoldUseCase,
    ],
)
def test_delete_use_cases_delegate_to_delete(use_case_cls):
    repo = Mock()
    repo.delete.return_value = True

    result = use_case_cls(repo).execute("entity-id")

    assert result is True
    repo.delete.assert_called_once_with("entity-id")


def test_room_hold_acquire_check_validate_and_cleanup_paths():
    active_hold = SimpleNamespace(is_active=lambda: True)
    inactive_hold = SimpleNamespace(is_active=lambda: False)
    repo = Mock()

    repo.acquire_hold_atomically.return_value = active_hold
    acquired = AcquireRoomHoldUseCase(repo).execute("h1", "u1", datetime.utcnow(), datetime.utcnow() + timedelta(days=1), hold_duration_minutes=10)
    assert acquired is active_hold
    repo.acquire_hold_atomically.assert_called_once()

    repo.find_active_hold_for_room.return_value = active_hold
    checked = CheckRoomHoldUseCase(repo).execute("h1", datetime.utcnow(), datetime.utcnow() + timedelta(days=1))
    assert checked is active_hold

    repo.find_active_hold_by_user_and_room.return_value = active_hold
    assert ValidateUserHoldUseCase(repo).execute("u1", "h1", datetime.utcnow(), datetime.utcnow() + timedelta(days=1)) is True

    repo.find_active_hold_by_user_and_room.return_value = inactive_hold
    assert ValidateUserHoldUseCase(repo).execute("u1", "h1", datetime.utcnow(), datetime.utcnow() + timedelta(days=1)) is False

    repo.find_active_hold_by_user_and_room.return_value = None
    assert ValidateUserHoldUseCase(repo).execute("u1", "h1", datetime.utcnow(), datetime.utcnow() + timedelta(days=1)) is False

    repo.delete_expired.return_value = 7
    assert CleanupExpiredHoldsUseCase(repo).execute() == 7
    repo.delete_expired.assert_called_once_with()
