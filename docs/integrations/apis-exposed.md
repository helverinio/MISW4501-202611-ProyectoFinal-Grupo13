# APIs Exposed

Todas las rutas son accesibles vía el **Gateway** en `http://localhost:8081/api/v1/...`

---

## Catálogo — Países

| Método | Ruta | Body / Parámetros | Respuesta |
|--------|------|-------------------|-----------|
| `POST` | `/paises` | `{nombre}` | `{id, nombre}` 201 |
| `GET` | `/paises` | — | `[{id, nombre}]` 200 |
| `GET` | `/paises/{id}` | — | `{id, nombre}` 200 |
| `PUT` | `/paises/{id}` | `{nombre?}` | `{id, nombre}` 200 |
| `DELETE` | `/paises/{id}` | — | `{message}` 200 |
| `GET` | `/paises/{id}/ciudades` | — | `[ciudad]` 200 |

## Catálogo — Ciudades

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/ciudades` | `{nombre, id_pais}` | `{id, nombre, id_pais}` 201 |
| `GET` | `/ciudades` | — | `[ciudad]` |
| `GET` | `/ciudades/{id}` | — | `{id, nombre, id_pais}` |
| `PUT` | `/ciudades/{id}` | parcial | ciudad |
| `DELETE` | `/ciudades/{id}` | — | `{message}` |
| `GET` | `/ciudades/{id}/hoteles` | — | `[hotel]` |

## Catálogo — Hoteles

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/hoteles` | `{nombre, email, id_ciudad, descripcion?, amenidades?}` | `{id, nombre, email, descripcion, amenidades, id_ciudad}` 201 |
| `GET` | `/hoteles` | — | `[hotel]` |
| `GET` | `/hoteles/{id}` | — | hotel |
| `PUT` | `/hoteles/{id}` | parcial | hotel |
| `DELETE` | `/hoteles/{id}` | — | `{message}` |
| `GET` | `/hoteles/{id}/habitaciones` | — | `[habitacion]` |
| `GET` | `/hoteles/populares-por-ciudad?limit=4` | query `limit` opcional | `{total_ciudades, destinos:[{ciudad, pais, hotel_id, hotel_nombre, rating_promedio, cantidad_ratings, precio_minimo_noche, moneda, hoteles_disponibles_ciudad}]}` |

## Catálogo — Habitaciones

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/habitaciones` | `{tipo, nro_habitacion, capacidad, camas, id_hotel}` | `{id, tipo, nro_habitacion, capacidad, camas, id_hotel}` 201 |
| `GET` | `/habitaciones` | — | `[habitacion]` |
| `GET` | `/habitaciones/{id}` | — | habitacion |
| `PUT` | `/habitaciones/{id}` | parcial | habitacion |
| `DELETE` | `/habitaciones/{id}` | — | `{message}` |
| `GET` | `/habitaciones/{id}/tarifas` | — | `[tarifa]` |
| `GET` | `/habitaciones/{id}/reservas` | — | `[reserva]` |

## Catálogo — Tarifas

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/tarifas` | `{nombre, valor, descuento?, id_habitacion}` | `{id, nombre, valor, descuento, id_habitacion}` 201 |
| `GET` | `/tarifas` / `/tarifas/{id}` | — | tarifa(s) |
| `PUT` | `/tarifas/{id}` | parcial | tarifa |
| `DELETE` | `/tarifas/{id}` | — | `{message}` |

## Catálogo — Estados

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/estados` | `{nombre, descripcion?}` | `{id, nombre, descripcion}` 201 |
| `GET` | `/estados` / `/estados/{id}` | — | estado(s) |
| `PUT` | `/estados/{id}` | parcial | estado |
| `DELETE` | `/estados/{id}` | — | `{message}` |

---

## Room Holds

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/habitaciones/{id}/hold` | `{id_usuario, fecha_ingreso, fecha_salida, hold_duration_minutes?}` | `{id, id_habitacion, id_usuario, fecha_ingreso, fecha_salida, created_at, expires_at}` 201 / 409 / 429 |
| `POST` | `/habitaciones/{id}/hold/check` | `{fecha_ingreso, fecha_salida}` | estado del hold |
| `GET` | `/holds/{hold_id}` | — | hold (Redis cache → DB fallback) |
| `DELETE` | `/holds/{hold_id}` | — | `{message}` |
| `POST` | `/holds/cleanup` | — | `{deleted_count}` |

---

## Reservas

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/reservas` | `{fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion, id_estado, payment_method?}` | `{id, ..., payment: {payment_id, payment_intent_id, payment_status}}` 201 |
| `GET` | `/reservas` | — | `[reserva]` |
| `GET` | `/reservas/{id}` | — | reserva |
| `PUT` | `/reservas/{id}` | parcial | reserva |
| `DELETE` | `/reservas/{id}` | — | `{message}` |
| `GET` | `/usuarios/{id}/reservas` | — | `[reserva]` |
| `GET` | `/reservas/{id}/pagos` | — | `[pago]` |
| `GET` | `/reservas/{id}/notificaciones` | — | `[notificacion]` |
| `POST` | `/reservas/webhook/pms` | `{fecha_ingreso, fecha_salida, total, nro_personas, id_usuario, id_pais, id_habitacion}` | reserva 201 |

---

## Pagos (shadow en `reservas`)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/pagos` | `{fecha_pago, total, estado, id_pais, id_reserva, payment_method?, currency?, description?}` | `{id, ..., external_payment}` 201 |
| `GET` | `/pagos` / `/pagos/{id}` | — | pago(s) |
| `PUT` | `/pagos/{id}` | parcial | pago |
| `DELETE` | `/pagos/{id}` | — | `{message}` |

## Pagos (orquestación en `pagos`)

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/payments` | `{reservation_id, amount, currency?, payment_method, description?}` | `{id, payment_intent_id, reservation_id, amount, currency, status, payment_method, created_at, updated_at}` 201 |
| `POST` | `/payments/{id}/process` | — | payment 200 |
| `POST` | `/payments/webhook` | `{payment_intent_id, status}` | payment 200 |
| `GET` | `/payments/{id}` | — | payment con `external_payment_details` |
| `GET` | `/payments` | — | `[payment]` |
| `GET` | `/payments/reservation/{reservation_id}` | — | payment |

---

## Notificaciones

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/notificaciones` | `{fecha_notif, titulo, id_reserva, descripcion?}` | `{id, fecha_notif, titulo, descripcion, id_reserva}` 201 |
| `GET` | `/notificaciones` / `/notificaciones/{id}` | — | notificacion(es) |
| `PUT` | `/notificaciones/{id}` | parcial | notificacion |
| `DELETE` | `/notificaciones/{id}` | — | `{message}` |

---

## Health Checks

| Servicio | Endpoint | Respuesta |
|----------|----------|-----------|
| Gateway | `GET /health` | `{status, service}` |
| Reservas | `GET /api/v1/health` | `{status, service, redis: {status}}` |
| Pagos | `GET /api/v1/health` | `{status, service}` |
| Ext-Payments | `GET /api/v1/health` | `{status, service}` |