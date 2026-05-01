export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface RegisterUserRequest {
  nombre: string;
  email: string;
  usuario: string;
  contrasena: string;
}

export interface RegisterUserResponse {
  id: string | number;
  nombre: string;
  email: string;
  usuario: string;
  ciudad_id?: string | null;
  role?: string;
  status?: string;
  mfa_enabled?: boolean;
  creado_en?: string | null;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer' | string;
  expires_in: number;
  usuario: AuthUser;
}
