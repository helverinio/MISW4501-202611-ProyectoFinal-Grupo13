import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  HotelByIdResponse,
  HotelRoomResponse,
  SearchAvailableHotelsRequest,
  SearchAvailableHotelsResponse,
} from '../models/search-results.models';

@Injectable({ providedIn: 'root' })
export class SearchHotelsService {
  constructor(private readonly http: HttpClient) {}

  searchAvailableHotels(
    payload: SearchAvailableHotelsRequest,
  ): Observable<SearchAvailableHotelsResponse> {
    return this.http
      .post<SearchAvailableHotelsResponse>(
        `${environment.apiBaseUrl}/hoteles/buscar-disponibles`,
        payload,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getHotelById(hotelId: string): Observable<HotelByIdResponse> {
    return this.http
      .get<HotelByIdResponse>(`${environment.apiBaseUrl}/hoteles/${hotelId}`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getRoomsByHotelId(hotelId: string): Observable<HotelRoomResponse[]> {
    return this.http
      .get<HotelRoomResponse[]>(`${environment.apiBaseUrl}/hoteles/${hotelId}/habitaciones`)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }
}
