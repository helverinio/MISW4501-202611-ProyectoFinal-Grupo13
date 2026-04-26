import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateHabitacionRequest,
  CreatePlanTarifarioRequest,
  CreateReglaRequest,
  CreateTipoHabitacionRequest,
  Habitacion,
  Hotel,
  PlanTarifario,
  ReglaTarifaria,
  TipoHabitacion,
} from '../models/rate-management.models';

@Injectable({ providedIn: 'root' })
export class RateManagementService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  // Admin hotels
  getMisHoteles(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(`${this.base}/admin/mis-hoteles`);
  }

  asignarHotel(hotelId: string): Observable<unknown> {
    return this.http.post(`${this.base}/admin/hoteles/${hotelId}/asignar`, {});
  }

  desasignarHotel(hotelId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/hoteles/${hotelId}/desasignar`);
  }

  // Tipos habitacion
  getTiposHabitacion(hotelId: string): Observable<TipoHabitacion[]> {
    return this.http.get<TipoHabitacion[]>(`${this.base}/hoteles/${hotelId}/tipos-habitacion`);
  }

  createTipoHabitacion(
    hotelId: string,
    data: CreateTipoHabitacionRequest,
  ): Observable<TipoHabitacion> {
    return this.http.post<TipoHabitacion>(`${this.base}/hoteles/${hotelId}/tipos-habitacion`, data);
  }

  updateTipoHabitacion(
    tipoId: string,
    data: Partial<CreateTipoHabitacionRequest>,
  ): Observable<TipoHabitacion> {
    return this.http.put<TipoHabitacion>(`${this.base}/tipos-habitacion/${tipoId}`, data);
  }

  deleteTipoHabitacion(tipoId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/tipos-habitacion/${tipoId}`);
  }

  // Planes tarifarios
  getPlanesForTipo(tipoId: string): Observable<PlanTarifario[]> {
    return this.http.get<PlanTarifario[]>(
      `${this.base}/tipos-habitacion/${tipoId}/planes-tarifarios`,
    );
  }

  createPlan(tipoId: string, data: CreatePlanTarifarioRequest): Observable<PlanTarifario> {
    return this.http.post<PlanTarifario>(
      `${this.base}/tipos-habitacion/${tipoId}/planes-tarifarios`,
      data,
    );
  }

  getPlan(planId: string): Observable<PlanTarifario> {
    return this.http.get<PlanTarifario>(`${this.base}/planes-tarifarios/${planId}`);
  }

  updatePlan(
    planId: string,
    data: Partial<CreatePlanTarifarioRequest & { activo: boolean }>,
  ): Observable<PlanTarifario> {
    return this.http.put<PlanTarifario>(`${this.base}/planes-tarifarios/${planId}`, data);
  }

  deletePlan(planId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/planes-tarifarios/${planId}`);
  }

  // Reglas tarifarias
  getReglas(planId: string): Observable<ReglaTarifaria[]> {
    return this.http.get<ReglaTarifaria[]>(`${this.base}/planes-tarifarios/${planId}/reglas`);
  }

  createRegla(planId: string, data: CreateReglaRequest): Observable<ReglaTarifaria> {
    return this.http.post<ReglaTarifaria>(`${this.base}/planes-tarifarios/${planId}/reglas`, data);
  }

  updateRegla(
    reglaId: string,
    data: Partial<CreateReglaRequest & { activo: boolean }>,
  ): Observable<ReglaTarifaria> {
    return this.http.put<ReglaTarifaria>(`${this.base}/reglas-tarifarias/${reglaId}`, data);
  }

  deleteRegla(reglaId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/reglas-tarifarias/${reglaId}`);
  }

  // Habitaciones
  getHabitacionesByTipo(tipoId: string): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(`${this.base}/tipos-habitacion/${tipoId}/habitaciones`);
  }

  createHabitacion(
    tipoId: string,
    hotelId: string,
    tipoNombre: string,
    data: CreateHabitacionRequest,
  ): Observable<Habitacion> {
    return this.http.post<Habitacion>(`${this.base}/habitaciones`, {
      ...data,
      tipo: tipoNombre,
      id_hotel: hotelId,
      id_tipo_habitacion: tipoId,
    });
  }

  updateHabitacion(id: string, data: Partial<CreateHabitacionRequest>): Observable<Habitacion> {
    return this.http.put<Habitacion>(`${this.base}/habitaciones/${id}`, data);
  }

  deleteHabitacion(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/habitaciones/${id}`);
  }
}
