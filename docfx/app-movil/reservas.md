# Proceso de reserva y gestion de reservas

## Proceso de reserva

La app incluye las pantallas `Booking`, `Booking Pending` y `Booking Confirmed`.

### Paso a paso

1. Seleccione el alojamiento deseado.
2. Revise los detalles de la habitacion y las fechas.
3. Complete la informacion solicitada.
4. Confirme la reserva o el pago.

**Resultado esperado**  
La reserva queda registrada y la app muestra un estado de confirmacion o de espera.

## Confirmacion de estado

### Estados identificados en el prototipo

| Pantalla | Significado esperado |
| --- | --- |
| `Booking Pending` | El proceso esta en espera de validacion |
| `Booking Confirmed` | La reserva fue exitosa |
| `Reservation Details` | Vista detallada de una reserva existente |

`[AGREGAR CAPTURA: movil-booking-confirmed]`

## Visualizacion de reservas

### Paso a paso

1. Abra la seccion `My Reservations 2`.
2. Revise la lista de reservas activas o historicas.
3. Seleccione una reserva para ver `Reservation Details`.

**Resultado esperado**  
El usuario consulta facilmente su itinerario y estado de viaje.

## Edicion o cancelacion

### Paso a paso

1. Abra una reserva desde la lista.
2. Ingrese a `Edit Reservation` si requiere cambios.
3. Ingrese a `Cancel Reservation 2` si requiere cancelarla.
4. Confirme la accion.

> [!WARNING]
> Documente las restricciones reales de edicion o cancelacion solo despues de validarlas con el prototipo.
