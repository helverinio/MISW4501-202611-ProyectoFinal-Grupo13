export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  usuario: string;
  role: string;
  status: string;
}

export interface AdminLoginStep1Request {
  email: string;
  contrasena: string;
}

export interface AdminLoginStep1Response {
  mfa_required: boolean;
  challenge_token: string;
  expires_in: number;
}

export interface AdminLoginStep2Request {
  challenge_token: string;
  code: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  usuario: AuthUser;
}

export interface RegisterAdminRequest {
  nombre: string;
  email: string;
  contrasena: string;
  usuario?: string;
}

export interface RegisterAdminResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  setup_url: string;
  otpauth_uri: string;
}
