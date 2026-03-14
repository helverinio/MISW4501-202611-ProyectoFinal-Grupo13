# Reservas, confirmacion y seguimiento

## Creacion de reserva

### Paso a paso

1. Seleccione la propiedad y tarifa deseadas.
2. Ingrese o confirme los datos del huesped.
3. Revise el resumen de la reserva.
4. Complete la accion de pago o confirmacion.

**Resultado esperado**  
El sistema genera una reserva en estado confirmado o pendiente.

## Confirmacion de reserva

Las pantallas `Booking Confirmation`, `Payment Pending` y `Payment Cancelled` muestran distintos resultados del proceso.

### Posibles estados observados

| Estado | Interpretacion |
| --- | --- |
| `Booking Confirmed` | La reserva quedo confirmada |
| `Payment Pending` | La reserva o el pago sigue en validacion |
| `Payment Cancelled` | La transaccion no termino de forma exitosa |

### Resultado esperado

El usuario visualiza un numero de reserva, resumen del hotel, fechas, datos del huesped y total pagado o pendiente.

`[AGREGAR CAPTURA: web-booking-confirmation]`

## Consulta de mis reservas

La pantalla `My Reservations` centraliza las reservas del usuario.

### Funciones visibles en el prototipo

- Filtros por `All Reservations`, `Upcoming`, `Past` y `Cancelled`.
- Busqueda por texto.
- Visualizacion de estado como `Confirmed` o `Pending`.
- Acciones `View Details` y `Modify`.

### Paso a paso

1. Ingrese a `My Reservations`.
2. Use los filtros segun el tipo de reserva que desea ver.
3. Si lo necesita, busque por referencia o nombre.
4. Abra el detalle o seleccione modificar.

**Resultado esperado**  
El usuario encuentra y gestiona facilmente sus reservas.

## Modificacion de reservas

### Paso a paso

1. Entre a `My Reservations`.
2. Seleccione la reserva deseada.
3. Presione `Modify` o ingrese a `Modify Reservation`.
4. Ajuste fechas, ocupacion o condiciones permitidas.
5. Confirme el cambio.

> [!NOTE]
> El alcance exacto de la modificacion debe validarse en la pantalla `Modify Reservation`.

## Cancelacion de reservas

### Paso a paso

1. Abra la reserva que desea cancelar.
2. Ingrese a la opcion `Cancel Reservation`.
3. Revise la politica aplicable.
4. Confirme la cancelacion.

**Resultado esperado**  
La reserva cambia a estado cancelado y el usuario recibe un mensaje de confirmacion.

> [!WARNING]
> Verifique si existen penalidades, devoluciones parciales o condiciones de tarifa antes de documentar el flujo final.
