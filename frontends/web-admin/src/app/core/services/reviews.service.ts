import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminReviewResponse,
  ReviewsFilterParams,
} from '../models/reviews.models';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Get admin reviews with filtering, sorting, and pagination.
   * @param params Filter parameters including pagination and sort
   * @returns Observable of AdminReviewResponse with reviews and KPIs
   */
  getAdminReviews(params: ReviewsFilterParams = {}): Observable<AdminReviewResponse> {
    let httpParams = new HttpParams();

    if (params.hotel_id) {
      httpParams = httpParams.set('hotel_id', params.hotel_id);
    }
    if (params.rating != null) {
      httpParams = httpParams.set('rating', String(params.rating));
    }
    if (params.date_from) {
      httpParams = httpParams.set('date_from', params.date_from);
    }
    if (params.date_to) {
      httpParams = httpParams.set('date_to', params.date_to);
    }
    if (params.sentiment) {
      httpParams = httpParams.set('sentiment', params.sentiment);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.page != null) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.per_page != null) {
      httpParams = httpParams.set('per_page', String(params.per_page));
    }
    if (params.sort_by) {
      httpParams = httpParams.set('sort_by', params.sort_by);
    }

    return this.http.get<AdminReviewResponse>(`${this.base}/admin/reviews`, {
      params: httpParams,
    });
  }
}
