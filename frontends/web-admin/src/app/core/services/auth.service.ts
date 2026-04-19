import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminLoginStep1Request,
  AdminLoginStep1Response,
  AdminLoginStep2Request,
  AuthUser,
  LoginResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenKey = 'travelhub.admin.access_token';
  private readonly refreshTokenKey = 'travelhub.admin.refresh_token';
  private readonly userKey = 'travelhub.admin.user';

  private readonly accessTokenState = signal<string | null>(
    localStorage.getItem(this.accessTokenKey),
  );
  private readonly currentUserState = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenState());

  constructor(private readonly http: HttpClient) {}

  registerAdmin(payload: RegisterAdminRequest): Observable<RegisterAdminResponse> {
    return this.http.post<RegisterAdminResponse>(`${environment.apiBaseUrl}/admin/auth/register`, payload);
  }

  verifySetup(email: string, code: string): Observable<void> {
    return this.http.post<{ message: string }>(`${environment.apiBaseUrl}/admin/auth/verify-setup`, { email, code }).pipe(
      map(() => void 0),
    );
  }

  loginStep1(payload: AdminLoginStep1Request): Observable<AdminLoginStep1Response> {
    return this.http.post<AdminLoginStep1Response>(`${environment.apiBaseUrl}/admin/auth/login/step1`, payload);
  }

  loginStep2(payload: AdminLoginStep2Request): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/admin/auth/login/step2`, payload).pipe(
      tap((response: LoginResponse) => this.persistSession(response)),
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
