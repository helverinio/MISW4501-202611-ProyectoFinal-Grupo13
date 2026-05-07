import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  RevenueReportParams,
  RevenueReportResponse,
} from '../models/revenue-reports.models';

@Injectable({ providedIn: 'root' })
export class RevenueReportsService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getRevenueReport(params: RevenueReportParams = {}): Observable<RevenueReportResponse> {
    let httpParams = new HttpParams();
    if (params.month != null) httpParams = httpParams.set('month', String(params.month));
    if (params.year != null) httpParams = httpParams.set('year', String(params.year));
    if (params.hotel_id) httpParams = httpParams.set('hotel_id', params.hotel_id);

    return this.http.get<RevenueReportResponse>(`${this.base}/admin/revenue-report`, {
      params: httpParams,
    });
  }
}
