import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  HotelByIdResponse,
  HotelCommentsResponse,
  HotelRoomResponse,
  PopularDestinationsByCityResponse,
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

  getPopularDestinationsByCity(limit = 4): Observable<PopularDestinationsByCityResponse> {
    return this.http
      .get<PopularDestinationsByCityResponse>(
        `${environment.apiBaseUrl}/hoteles/populares-por-ciudad?limit=${limit}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }

  getHotelComments(hotelId: string, page = 1, perPage = 3): Observable<HotelCommentsResponse> {
    return this.http
      .get<HotelCommentsResponse>(
        `${environment.apiBaseUrl}/hoteles/${hotelId}/comentarios?page=${page}&per_page=${perPage}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
  }
}
