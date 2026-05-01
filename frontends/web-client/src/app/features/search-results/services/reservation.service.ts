import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface CiudadResponse {
  id: string;
  nombre: string;
  id_pais: string;
}

export interface PaisResponse {
  id: string;
  nombre: string;
}

export interface EstadoResponse {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface HabitacionResponse {
  id: string;
  tipo: string;
  nro_habitacion: number;
  capacidad: number;
  camas: number;
  id_hotel: string;
}

export interface AcquireHoldPayload {
  id_usuario: string;
  fecha_ingreso: string;
  fecha_salida: string;
}

export interface RoomHoldResponse {
  id: string;
  id_habitacion: string;
  id_usuario: string;
  fecha_ingreso: string;
  fecha_salida: string;
  created_at: string;
  expires_at: string;
}

export interface CreateReservaPayload {
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
  payment_method: 'card' | 'pse' | 'transfer';
}

export interface CreatedReservaResponse {
  id: string;
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
  payment?: {
    payment_id?: string | null;
    payment_intent_id?: string | null;
    payment_status?: string | null;
  } | null;
}

export interface PaymentResponse {
  id: string;
  payment_intent_id: string;
  reservation_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  external_payment_id?: string | null;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessPaymentPayload {
  payment_method: 'card' | 'pse' | 'transfer';
  card_number?: string;
  expiry_date?: string;
  cvv?: string;
  cardholder_name?: string;
  billing_address?: string;
  city?: string;
  postal_code?: string;
}

export interface ReservaResponse {
  id: string;
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
}

export interface UsuarioResponse {
  id: string | number;
  nombre: string;
  email: string;
}

export interface UpdateReservaPayload {
  fecha_ingreso?: string;
  fecha_salida?: string;
  total?: number;
  nro_personas?: number;
  id_usuario?: string;
  id_pais?: string;
  id_habitacion?: string;
  id_estado?: string;
}

export interface RecentlyViewedHotelResponse {
  reserva_id: string;
  hotel_id: string;
  hotel_name: string;
  city: string | null;
  country: string | null;
  rating: number | null;
  nightly_price: number;
  total: number;
  fecha_ingreso: string;
  fecha_salida: string;
  created_at: string | null;
}

export interface CreateNotificacionPayload {
  fecha_notif?: string;
  titulo: string;
  id_reserva: string;
  descripcion?: string;
}

export interface NotificacionResponse {
  id: string;
  fecha_notif: string;
  titulo: string;
  descripcion?: string | null;
  id_reserva: string;
}

export interface CreateHotelCommentPayload {
  id_reserva: string;
  rating: number;
  comentario?: string | null;
  id_usuario?: string;
}

export interface CreateHotelCommentResponse {
  id: string;
  id_hotel: string;
  id_usuario: string;
  id_reserva: string;
  comentario: string | null;
  rating: number;
  created_at: string;
  updated_at: string;
  rating_hotel?: {
    rating_promedio: number;
    cantidad_ratings: number;
    cantidad_comentarios: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private readonly http: HttpClient) {}

  getCiudadById(ciudadId: string): Observable<CiudadResponse> {
    return this.http
      .get<CiudadResponse>(`${environment.apiBaseUrl}/ciudades/${ciudadId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getPaisById(paisId: string): Observable<PaisResponse> {
    return this.http
      .get<PaisResponse>(`${environment.apiBaseUrl}/paises/${paisId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getEstados(): Observable<EstadoResponse[]> {
    return this.http
      .get<EstadoResponse[]>(`${environment.apiBaseUrl}/estados`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getHabitacionById(habitacionId: string): Observable<HabitacionResponse> {
    return this.http
      .get<HabitacionResponse>(`${environment.apiBaseUrl}/habitaciones/${habitacionId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getReservasByUsuario(usuarioId: string): Observable<ReservaResponse[]> {
    return this.http
      .get<ReservaResponse[]>(`${environment.apiBaseUrl}/usuarios/${usuarioId}/reservas`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getUsuarioById(usuarioId: string): Observable<UsuarioResponse> {
    return this.http
      .get<UsuarioResponse>(`${environment.apiBaseUrl}/usuarios/${usuarioId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getRecentlyViewedHotels(
    usuarioId: string,
    limit: number = 3,
  ): Observable<RecentlyViewedHotelResponse[]> {
    return this.http
      .get<
        RecentlyViewedHotelResponse[]
      >(`${environment.apiBaseUrl}/usuarios/${usuarioId}/reservas/recently-viewed?limit=${limit}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  acquireRoomHold(habitacionId: string, payload: AcquireHoldPayload): Observable<RoomHoldResponse> {
    return this.http
      .post<RoomHoldResponse>(
        `${environment.apiBaseUrl}/habitaciones/${habitacionId}/hold`,
        payload,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  releaseHold(holdId: string): Observable<unknown> {
    return this.http
      .delete(`${environment.apiBaseUrl}/holds/${holdId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  createReserva(payload: CreateReservaPayload): Observable<CreatedReservaResponse> {
    return this.http
      .post<CreatedReservaResponse>(`${environment.apiBaseUrl}/reservas`, payload)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  processPayment(paymentId: string, payload: ProcessPaymentPayload): Observable<PaymentResponse> {
    return this.http
      .post<PaymentResponse>(`${environment.apiBaseUrl}/payments/${paymentId}/process`, payload)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getPayment(paymentId: string): Observable<PaymentResponse> {
    return this.http
      .get<PaymentResponse>(`${environment.apiBaseUrl}/payments/${paymentId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  createNotificacion(payload: CreateNotificacionPayload): Observable<NotificacionResponse> {
    return this.http
      .post<NotificacionResponse>(`${environment.apiBaseUrl}/notificaciones`, payload)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  updateReserva(reservaId: string, payload: UpdateReservaPayload): Observable<ReservaResponse> {
    return this.http
      .put<ReservaResponse>(`${environment.apiBaseUrl}/reservas/${reservaId}`, payload)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  deleteReserva(reservaId: string): Observable<unknown> {
    return this.http
      .delete(`${environment.apiBaseUrl}/reservas/${reservaId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  createHotelComment(
    hotelId: string,
    payload: CreateHotelCommentPayload,
  ): Observable<CreateHotelCommentResponse> {
    return this.http
      .post<CreateHotelCommentResponse>(
        `${environment.apiBaseUrl}/hoteles/${hotelId}/comentarios`,
        payload,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getNotificacionesByReservaAndType(
    reservaId: string,
    notificationType: string,
  ): Observable<NotificacionResponse[]> {
    return this.http
      .get<NotificacionResponse[]>(
        `${environment.apiBaseUrl}/reservas/${reservaId}/notificaciones?tipo=${notificationType}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }
}
