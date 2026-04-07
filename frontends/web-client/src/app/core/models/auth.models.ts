export interface LoginRequest {
  email: string;
  contrasena: string;
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
