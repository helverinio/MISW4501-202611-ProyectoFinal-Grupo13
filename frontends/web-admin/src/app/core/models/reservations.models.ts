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

export interface ReservationPaymentItem {
  id: string;
  fecha_pago: string | null;
  total: number;
  estado: string;
}

export interface ReservationPriceNightDetail {
  fecha_noche: string | null;
  precio_noche: number;
  subtotal_noche: number;
}

export interface ReservationPriceBreakdown {
  subtotal_noches: number;
  impuestos_estimados: number;
  total_pagado: number;
  balance_pendiente: number;
  detalle_noches: ReservationPriceNightDetail[];
}

export interface ReservationTimelineItem {
  type: string;
  title: string;
  at: string | null;
  description: string;
  amount?: number;
  status?: string;
  updated_by_user_id?: string | null;
  version?: number;
}

export interface ReservationDetailResponse {
  id: string;
  id_corto: string;
  fecha_ingreso: string | null;
  fecha_salida: string | null;
  nro_noches: number | null;
  nro_personas: number;
  total: number;
  id_usuario: string;
  created_at: string | null;
  updated_at: string | null;
  updated_by_user_id: string | null;
  version: number;
  habitacion: ReservationHabitacion & {
    capacidad: number;
    camas: number;
  };
  hotel: ReservationHotel;
  estado: ReservationEstado;
  payments: ReservationPaymentItem[];
  price_breakdown: ReservationPriceBreakdown;
  timeline: ReservationTimelineItem[];
}

export interface UpdateReservationStateRequest {
  id_estado: string;
  version: number;
  reason?: string;
}

export interface UpdateReservationStateResponse {
  id: string;
  id_estado: string;
  estado_nombre: string;
  version: number;
}
