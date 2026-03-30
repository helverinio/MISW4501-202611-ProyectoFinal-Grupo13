import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
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
}
