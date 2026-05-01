# Cancellation Email Flow Implementation

## Overview
Implemented end-to-end cancellation email notification system with idempotency tracking via notification log.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CancelReservationPageComponent                                 │
│  └─ confirmCancellation()                                       │
│     ├─ updateReserva() → backend cancels reservation            │
│     └─ [success] sendCancellationEmailIfNeeded()               │
│        ├─ Check notificaciones table for existing email         │
│        ├─ If NOT exists:                                        │
│        │  ├─ EmailDeliveryService.sendCancellationEmail()      │
│        │  │  └─ EmailJS POST → Send email                      │
│        │  └─ ReservationService.createNotificacion()            │
│        │     └─ Log email sent to notificaciones table          │
│        └─ If exists: Skip (already sent)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GATEWAY (Python)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET  /reservas/<id>/notificaciones?tipo=cancelacion            │
│  POST /notificaciones                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESERVAS MICROSERVICE (Python)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET  /reservas/<id>/notificaciones                             │
│  └─ GetNotificacionesByReservaUseCase OR                        │
│     GetNotificacionesByReservaAndTypeUseCase                    │
│                                                                 │
│  POST /notificaciones                                           │
│  └─ CreateNotificacionUseCase                                  │
│     └─ NotificacionModel.save() → PostgreSQL                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EMAILJS (External Service)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EmailJS API  → Send email via configured template             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Frontend Changes

#### a) EmailDeliveryService Enhancement
**File:** `frontends/web-client/src/app/core/services/email-delivery.service.ts`

- Added `CancellationEmailPayload` interface:
  ```typescript
  interface CancellationEmailPayload {
    toEmail: string;
    reservationId: string;
    guestName: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    totalRefunded: string;
    cancellationReason?: string;
  }
  ```

- Added `sendCancellationEmail()` method:
  ```typescript
  sendCancellationEmail(payload: CancellationEmailPayload): Observable<string>
  ```
  - Sends cancellation email via EmailJS
  - Uses existing `environment.emailJs` configuration
  - Passes template parameters for email rendering

#### b) ReservationService Enhancement
**File:** `frontends/web-client/src/app/features/search-results/services/reservation.service.ts`

- Updated `CreateNotificacionPayload` to make `fecha_notif` optional
- Added `getNotificacionesByReservaAndType()` method:
  ```typescript
  getNotificacionesByReservaAndType(
    reservaId: string,
    notificationType: string
  ): Observable<NotificacionResponse[]>
  ```
  - Queries backend for notifications by reservation + type
  - Supports idempotency check (e.g., `tipo=cancelacion`)

#### c) CancelReservationPageComponent Integration
**File:** `frontends/web-client/src/app/features/private/pages/cancel-reservation-page/cancel-reservation-page.component.ts`

- Injected `EmailDeliveryService`
- Modified `confirmCancellation()` workflow:
  1. Cancel reservation via backend
  2. On success → Call `sendCancellationEmailIfNeeded()`
  3. New method flow:
     - Check `GET /reservas/{id}/notificaciones?tipo=cancelacion`
     - If empty: Send email + Create notification record
     - If exists: Skip (already sent)

### 2. Backend Changes

#### a) Repository Enhancement
**File:** `microservices/reservas/app/infrastructure/repositories/sqlalchemy_notificacion_repository.py`

- Added `find_by_reserva_and_type()` method:
  ```python
  def find_by_reserva_and_type(self, reserva_id: str, titulo: str) -> List[Notificacion]
  ```
  - Queries notifications by reservation ID + type (titulo)

#### b) Use Case Enhancement
**File:** `microservices/reservas/app/application/use_cases/notificacion_use_cases.py`

- Added `GetNotificacionesByReservaAndTypeUseCase` class:
  ```python
  class GetNotificacionesByReservaAndTypeUseCase:
      def execute(self, reserva_id: str, titulo: str) -> List[Notificacion]
  ```

#### c) API Endpoint Enhancement
**File:** `microservices/reservas/app/api/v1/notificaciones.py`

- Updated `POST /notificaciones` to auto-generate `fecha_notif` if not provided
- Modified `GET /reservas/<reserva_id>/notificaciones` to accept `tipo` query parameter:
  ```python
  @api_v1_bp.route('/reservas/<reserva_id>/notificaciones', methods=['GET'])
  def get_notificaciones_by_reserva(reserva_id, current_usuario=None):
      tipo = request.args.get('tipo')
      if tipo:
          use_case = GetNotificacionesByReservaAndTypeUseCase(...)
      else:
          use_case = GetNotificacionesByReservaUseCase(...)
  ```

#### d) Gateway Routing
**File:** `microservices/gateway/app/api/v1/reservas.py`

- Updated endpoint to pass `tipo` parameter:
  ```python
  result = get_service().get_notificaciones_by_reserva(
      reserva_id, 
      request.args.get('tipo')
  )
  ```

**File:** `microservices/gateway/app/services/reservas_service.py`

- Enhanced `get_notificaciones_by_reserva()` to support type filtering:
  ```python
  def get_notificaciones_by_reserva(
      self, 
      reserva_id: str, 
      tipo: str = None
  ) -> Dict[str, Any]:
      params = {'tipo': tipo} if tipo else None
      return self._request('GET', f'reservas/{reserva_id}/notificaciones', params=params)
  ```

## Idempotency Strategy

### Problem
Duplicate cancellation emails could be sent if user clicks cancel multiple times or page reloads occur.

### Solution
**Notification Log Pattern:**
1. Before sending email, check `notificaciones` table for record with:
   - `id_reserva` = target reservation ID
   - `titulo` = 'cancelacion'
2. If record exists: Email already sent, skip
3. If no record: Send email via EmailJS, then create notification log

### Data Model
**Table:** `notificaciones`
```
id (UUID)           - Primary key
fecha_notif         - Timestamp (auto-generated if not provided)
titulo              - Email type (e.g., 'cancelacion')
descripcion         - Optional details/reason
id_reserva (FK)     - Link to reservation
```

### Example Flow
```
Request 1:
  GET /reservas/res-123/notificaciones?tipo=cancelacion
  → Returns: [] (empty)
  → Action: Send email, create notification
  → Create: { titulo: 'cancelacion', id_reserva: 'res-123', fecha_notif: now() }

Request 2 (duplicate/retry):
  GET /reservas/res-123/notificaciones?tipo=cancelacion
  → Returns: [{ id: 'notif-456', titulo: 'cancelacion', ... }]
  → Action: Skip email (already sent)
```

## Email Template Variables

EmailJS template receives these parameters:
```javascript
{
  to_email: "user@example.com",
  email: "user@example.com",
  reservation_id: "res-123",
  guest_name: "John Doe",
  hotel_name: "Hotel Paradise",
  check_in: "2024-12-20",
  check_out: "2024-12-25",
  total_refunded: "1500.00",
  cancellation_reason: "travel_plans"
}
```

## Error Handling

### Frontend
- Silent failure for email send (logs to console)
- Notification creation failure is also silent
- User navigation proceeds regardless
- Email/notification errors don't block cancellation workflow

### Backend
- Auto-generates `fecha_notif` if missing
- Query filters return empty array if no notifications
- HTTP error responses properly handled by frontend

## Testing Scenarios

### Scenario 1: Normal Flow
1. User clicks cancel
2. Reservation marked as cancelled
3. Email sent successfully
4. Notification logged
5. User redirected to reservations list

### Scenario 2: Duplicate Prevention
1. User clicks cancel
2. Email sent, notification created
3. User navigates back and clicks cancel again
4. Check finds existing notification
5. Email NOT sent (prevented)

### Scenario 3: Email Failure
1. User clicks cancel
2. Reservation marked as cancelled
3. Email send fails (network error)
4. User still redirected (non-blocking)
5. Can retry by navigating back to cancellation

### Scenario 4: Notification Persistence
1. User cancels reservation
2. Email sent, notification created
3. Browser refreshes
4. Check query returns existing notification
5. No duplicate email sent

## Future Enhancements

1. **Email Queue:** Implement async email sending with queue (Bull/Celery)
2. **Retry Logic:** Auto-retry failed emails with exponential backoff
3. **Templates:** Support multiple cancellation email templates based on user preferences
4. **Webhooks:** Add cancellation webhook to trigger other business processes
5. **Multi-language:** Support cancellation emails in multiple languages
6. **Refund Status:** Include refund processing status in email

## Deployment Notes

1. Ensure EmailJS service ID/template ID are configured in `environment.production.ts`
2. Database migration required for `notificaciones` table (already exists)
3. No breaking changes to existing APIs
4. Backward compatible - `fecha_notif` optional in notifications endpoint

## Files Modified

### Frontend
- `src/app/core/services/email-delivery.service.ts`
- `src/app/features/search-results/services/reservation.service.ts`
- `src/app/features/private/pages/cancel-reservation-page/cancel-reservation-page.component.ts`

### Backend (Reservas Microservice)
- `app/infrastructure/repositories/sqlalchemy_notificacion_repository.py`
- `app/application/use_cases/notificacion_use_cases.py`
- `app/application/use_cases/__init__.py`
- `app/api/v1/notificaciones.py`

### Backend (Gateway)
- `app/api/v1/reservas.py`
- `app/services/reservas_service.py`

## Completion Status

✅ **COMPLETED**
- Email service integration
- Notification logging system
- Idempotency control via notification type check
- Frontend-backend integration
- Error handling (non-blocking)
- Type safety (TypeScript interfaces)
- Query parameter support for filtering
- Auto-timestamp generation
