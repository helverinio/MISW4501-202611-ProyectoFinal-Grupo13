# Bounded Contexts – TravelHub

## Contextos implementados en este repositorio

---

### 1. Catálogo / Disponibilidad (`reservas`)

**Servicio**: `reservas` (puerto 5000)
**BD**: PostgreSQL `reservas`

Responsable de:
- CRUD de Países, Ciudades, Hoteles, Habitaciones, Tarifas, Estados
- Consulta de disponibilidad vía holds activos
- Exposición de habitaciones por hotel, tarifas por habitación

**Modelos**: `paises`, `ciudades`, `hoteles`, `habitaciones`, `tarifas`, `estados`

---

### 2. Reservas / Hold (`reservas`)

**Servicio**: `reservas` (puerto 5000)
**BD**: PostgreSQL `reservas` (tablas `room_holds`, `reservas`)

Responsable de:
- Creación de hold temporal (15 minutos) sobre una habitación
- Validación de conflictos (Redis lock + DB check)
- Creación de reserva confirmada (requiere hold activo)
- Liberación de hold tras reserva exitosa
- Limpieza de holds expirados (`POST /holds/cleanup`)
- Integración con PMS via webhook (`POST /reservas/webhook/pms`)

**Modelos**: `room_holds`, `reservas`
**Dep. externa**: Redis (lock `room_hold_lock:{id}:{in}:{out}` y cache `room_hold_cache:{id}:{in}:{out}`)

---

### 3. Pagos internos (`pagos`)

**Servicio**: `pagos` (puerto 5002)
**BD**: PostgreSQL `pagos` (tabla `payments`)

Responsable de:
- Registro de pagos con idempotencia por `reservation_id`
- Orquestación del ciclo de vida: `pendiente` → `procesando` → `completado` / `abandonado`
- Detección de pagos abandonados (scheduler cada 60 segundos)
- Publicación de eventos `PaymentStatusUpdated` a ActiveMQ
- Recepción de webhook desde `ext-payments`

**Dep. externa**: `ext-payments` (circuit breaker), ActiveMQ, `reservas` (via webhook)

---

### 4. Pagos externos / PSP (`ext-payments`)

**Servicio**: `ext-payments` (puerto 5001)
**BD**: PostgreSQL `ext_payments` (tablas `payment_intents`, `payments`)

Responsable de:
- Simulación de PSP externo (Stripe / MercadoPago)
- Creación de PaymentIntents
- Procesamiento de pagos con notificación async vía webhook

**No** usa Redis ni ActiveMQ. Es el único servicio sin dependencias internas.

---

### 5. Gateway (`gateway`)

**Servicio**: `gateway` (puerto 8081)
**BD**: ninguna

Responsable de:
- Ser el único punto de entrada público
- Proxy transparente hacia `reservas` y `pagos`
- Recibir el webhook de `ext-payments` y redirigirlo a `reservas`

---

### 6. Notificaciones (dentro de `reservas`)

Responsable de:
- Registro de notificaciones asociadas a reservas
- CRUD de notificaciones (`/api/v1/notificaciones`)

**Modelo**: `notificaciones`
> No hay envío real de notificaciones (email/push) en este prototipo.

---

## Relaciones entre contextos

```
Cliente
  │
  └→ [Gateway]
	  ├→ [Catálogo/Disponibilidad] ← datos maestros (hoteles, hab.)
	  ├→ [Reservas/Hold]           ← hold + reserva (requiere catálogo)
	  └→ [Pagos internos]          ← orquesta pago (requiere reserva)
			 └→ [PSP ext-payments]  ← simulación de Stripe
				 └→ webhook → [Gateway] → [Reservas] (actualiza estado pago)

[PMS externo] → webhook → [Gateway] → [Reservas]
[ActiveMQ] ←→ [Pagos internos] ↔ [Reservas] (eventos PaymentStatusUpdated)
```

---

## Contextos NO implementados (pendientes)

- **Search / Ranking**: no existe endpoint de búsqueda por disponibilidad
- **Customer Operations**: no hay gestión de cancelaciones/cambios
- **Usuarios**: no existe autenticación ni gestión de perfil