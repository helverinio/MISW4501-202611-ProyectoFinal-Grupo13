import { AuthError } from './AuthError';
import { AuthResponse } from './AuthResponse';

export interface AuthResult {
  success: boolean;
  data?: AuthResponse;
  error?: AuthError;
}
