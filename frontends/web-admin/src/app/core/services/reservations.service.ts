import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Estado,
  ReservationDetailResponse,
  ReservationDashboardParams,
  ReservationDashboardResponse,
  UpdateReservationStateRequest,
  UpdateReservationStateResponse,
} from '../models/reservations.models';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getDashboard(params: ReservationDashboardParams = {}): Observable<ReservationDashboardResponse> {
    let httpParams = new HttpParams();
    if (params.fecha_desde) httpParams = httpParams.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) httpParams = httpParams.set('fecha_hasta', params.fecha_hasta);
    if (params.id_estado) httpParams = httpParams.set('id_estado', params.id_estado);
    if (params.tipo_habitacion)
      httpParams = httpParams.set('tipo_habitacion', params.tipo_habitacion);
    if (params.codigo) httpParams = httpParams.set('codigo', params.codigo);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.per_page != null) httpParams = httpParams.set('per_page', String(params.per_page));

    return this.http.get<ReservationDashboardResponse>(`${this.base}/admin/reservas/dashboard`, {
      params: httpParams,
    });
  }

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.base}/estados`);
  }

  getAdminReservaDetail(reservaId: string): Observable<ReservationDetailResponse> {
    return this.http.get<ReservationDetailResponse>(`${this.base}/admin/reservas/${reservaId}`);
  }

  updateReservaEstado(
    reservaId: string,
    payload: UpdateReservationStateRequest,
  ): Observable<UpdateReservationStateResponse> {
    return this.http.put<UpdateReservationStateResponse>(
      `${this.base}/admin/reservas/${reservaId}/estado`,
      payload,
    );
  }
}
