import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenKey = 'travelhub.access_token';
  private readonly refreshTokenKey = 'travelhub.refresh_token';
  private readonly userKey = 'travelhub.user';

  private readonly accessTokenState = signal<string | null>(
    localStorage.getItem(this.accessTokenKey),
  );
  private readonly currentUserState = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenState());

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => this.persistSession(response)),
      catchError((error) => throwError(() => error)),
    );
  }

  logout(): Observable<void> {
    if (!this.getAccessToken()) {
      this.clearSession();
      return of(void 0);
    }

    return this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      map(() => void 0),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
      tap(() => this.clearSession()),
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenState();
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(this.accessTokenKey, response.access_token);
    localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
    this.accessTokenState.set(response.access_token);
    this.currentUserState.set(response.usuario);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem(this.userKey);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      this.clearSession();
      return null;
    }
  }
}
