from datetime import datetime, timedelta

from app.domain.entities.ciudad import Ciudad
from app.domain.entities.estado import Estado
from app.domain.entities.habitacion import Habitacion
from app.domain.entities.hotel import Hotel
from app.domain.entities.notificacion import Notificacion
from app.domain.entities.pago import Pago
from app.domain.entities.pais import Pais
from app.domain.entities.reserva import Reserva
from app.domain.entities.reservation import Reservation
from app.domain.entities.room_hold import RoomHold
from app.domain.entities.tarifa import Tarifa


def test_entity_create_methods_build_expected_objects():
    now = datetime.utcnow()

    pais = Pais.create("Colombia")
    assert pais.id
    assert pais.nombre == "Colombia"

    ciudad = Ciudad.create("Bogota", pais.id)
    assert ciudad.id
    assert ciudad.nombre == "Bogota"
    assert ciudad.id_pais == pais.id

    hotel = Hotel.create("Hotel Uno", "hotel@correo.com", ciudad.id, "Desc", "Piscina")
    assert hotel.id
    assert hotel.nombre == "Hotel Uno"
    assert hotel.email == "hotel@correo.com"
    assert hotel.id_ciudad == ciudad.id

    habitacion = Habitacion.create("Suite", 501, 2, 1, hotel.id)
    assert habitacion.id
    assert habitacion.tipo == "Suite"
    assert habitacion.nro_habitacion == 501
    assert habitacion.id_hotel == hotel.id

    tarifa = Tarifa.create("Flexible", 250.0, 10.0, habitacion.id)
    assert tarifa.id
    assert tarifa.nombre == "Flexible"
    assert tarifa.valor == 250.0
    assert tarifa.id_habitacion == habitacion.id

    estado = Estado.create("Confirmada", "Pago validado")
    assert estado.id
    assert estado.nombre == "Confirmada"
    assert estado.descripcion == "Pago validado"

    reserva = Reserva.create(now, now + timedelta(days=2), 500.0, 2, "u1", pais.id, habitacion.id, estado.id)
    assert reserva.id
    assert reserva.id_usuario == "u1"
    assert reserva.id_habitacion == habitacion.id
    assert reserva.id_estado == estado.id

    pago = Pago.create(now, 500.0, "completado", pais.id, reserva.id)
    assert pago.id
    assert pago.estado == "completado"
    assert pago.id_reserva == reserva.id

    notificacion = Notificacion.create(now, "Pago recibido", reserva.id, "Notificacion de prueba")
    assert notificacion.id
    assert notificacion.titulo == "Pago recibido"
    assert notificacion.id_reserva == reserva.id

    legacy = Reservation.create("user-1", "event-1", "A1")
    assert legacy.id
    assert legacy.status == "pending"
    assert legacy.user_id == "user-1"
    assert legacy.event_id == "event-1"
    assert legacy.seat_number == "A1"


def test_room_hold_active_and_expired_transitions():
    now = datetime.utcnow()
    hold = RoomHold.create("hab-1", "user-1", now, now + timedelta(days=1), hold_duration_minutes=1)

    assert hold.id
    assert hold.id_habitacion == "hab-1"
    assert hold.id_usuario == "user-1"

    hold.expires_at = datetime.utcnow() + timedelta(minutes=5)
    assert hold.is_active() is True
    assert hold.is_expired() is False

    hold.expires_at = datetime.utcnow() - timedelta(seconds=1)
    assert hold.is_expired() is True
    assert hold.is_active() is False
