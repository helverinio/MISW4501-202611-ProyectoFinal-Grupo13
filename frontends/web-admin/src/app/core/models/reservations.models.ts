export interface ReservationStats {
  total: number;
  confirmadas: number;
  pendientes: number;
  canceladas: number;
  rechazadas: number;
  completadas: number;
}

export interface ReservationHabitacion {
  id: string;
  tipo: string;
  nro_habitacion: number;
}

export interface ReservationHotel {
  id: string;
  nombre: string;
}

export interface ReservationEstado {
  id: string;
  nombre: string;
}

export interface ReservationItem {
  id: string;
  id_corto: string;
  fecha_ingreso: string | null;
  fecha_salida: string | null;
  nro_noches: number | null;
  nro_personas: number;
  total: number;
  id_usuario: string;
  habitacion: ReservationHabitacion;
  hotel: ReservationHotel;
  estado: ReservationEstado;
  created_at: string | null;
}

export interface ReservationDashboardResponse {
  stats: ReservationStats;
  reservations: ReservationItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ReservationDashboardParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  id_estado?: string;
  tipo_habitacion?: string;
  codigo?: string;
  page?: number;
  per_page?: number;
}

export interface Estado {
  id: string;
  nombre: string;
  descripcion: string | null;
}
