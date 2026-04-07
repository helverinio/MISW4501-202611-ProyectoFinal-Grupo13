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

export interface CreateNotificacionPayload {
  fecha_notif: string;
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
}
