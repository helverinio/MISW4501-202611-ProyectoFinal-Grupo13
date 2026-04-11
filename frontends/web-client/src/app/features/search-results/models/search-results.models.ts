export interface SearchAvailableHotelsRequest {
  busqueda: string;
  fecha_ingreso: string;
  fecha_salida: string;
  nro_personas: number;
}

export interface AvailableRoomApi {
  habitacion_id: string;
  tipo: string;
  nro_habitacion: string;
  capacidad: number;
  camas: number;
}

export interface AvailableHotelApi {
  hotel_id: string;
  nombre: string;
  descripcion: string | null;
  amenidades: string | null;
  email: string | null;
  ciudad: string | null;
  pais: string | null;
  total_habitaciones_disponibles: number;
  habitaciones: AvailableRoomApi[];
}

export interface SearchAvailableHotelsResponse {
  total_hoteles: number;
  busqueda: string;
  fecha_ingreso: string;
  fecha_salida: string;
  nro_personas: number;
  hoteles: AvailableHotelApi[];
}

export interface HotelByIdResponse {
  id: string;
  nombre: string;
  email: string | null;
  descripcion: string | null;
  amenidades: string | null;
  id_ciudad: string;
}

export interface HotelRoomResponse {
  id: string;
  tipo: string;
  nro_habitacion: number;
  capacidad: number;
  camas: number;
  id_hotel: string;
}

export interface PopularDestinationByCityApi {
  ciudad: string;
  pais: string;
  id_ciudad: string;
  hotel_id: string;
  hotel_nombre: string;
  rating_promedio: number;
  cantidad_ratings: number;
  precio_minimo_noche: number | null;
  moneda: string;
  hoteles_disponibles_ciudad: number;
}

export interface PopularDestinationsByCityResponse {
  total_ciudades: number;
  destinos: PopularDestinationByCityApi[];
}

export interface SearchCriteriaVm {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nights: number;
}

export interface HotelResultVm {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  locationText: string;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  freeCancellation: boolean;
  cancellationText: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  availableRooms: number;
}

export type SortOption = 'popularity' | 'priceAsc' | 'priceDesc' | 'rating' | 'distance';
