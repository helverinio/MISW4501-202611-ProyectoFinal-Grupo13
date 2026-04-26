export interface Hotel {
  id: string;
  nombre: string;
  email: string;
  descripcion: string | null;
  amenidades: string | null;
  id_ciudad: string;
  asignacion_id?: string;
  asignado_en?: string;
}

export interface TipoHabitacion {
  id: string;
  nombre: string;
  descripcion: string | null;
  capacidad: number;
  camas: number;
  id_hotel: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanTarifario {
  id: string;
  nombre: string;
  descripcion: string | null;
  moneda: string;
  activo: boolean;
  id_tipo_habitacion: string;
  reglas?: ReglaTarifaria[];
}

export interface ReglaTarifaria {
  id: string;
  id_plan_tarifario: string;
  id_temporada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_semana_mask: string | null;
  precio_base_noche: number;
  prioridad: number;
  min_noches: number | null;
  combinable: boolean;
  activo: boolean;
}

export interface CreateTipoHabitacionRequest {
  nombre: string;
  descripcion?: string;
  capacidad: number;
  camas: number;
}

export interface CreatePlanTarifarioRequest {
  nombre: string;
  descripcion?: string;
  moneda?: string;
}

export interface CreateReglaRequest {
  precio_base_noche: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  dias_semana_mask?: string;
  prioridad?: number;
  min_noches?: number;
  combinable?: boolean;
  id_temporada?: string;
}

export interface Habitacion {
  id: string;
  tipo: string;
  nro_habitacion: number;
  capacidad: number;
  camas: number;
  id_hotel: string;
  id_tipo_habitacion: string;
}

export interface CreateHabitacionRequest {
  nro_habitacion: number;
  capacidad: number;
  camas: number;
}
