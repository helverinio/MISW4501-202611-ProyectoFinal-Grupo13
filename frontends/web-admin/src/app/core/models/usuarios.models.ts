export interface UsuarioDetail {
  id: string;
  nombre: string;
  email: string;
  usuario: string;
  ciudad_id?: number | null;
  country?: string | null;
  role: string;
  status: string;
  mfa_enabled: boolean;
  creado_en?: string;
}
