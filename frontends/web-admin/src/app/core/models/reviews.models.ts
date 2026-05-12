/**
 * Frontend models for Reviews & Ratings feature
 */

export interface AdminReviewResponse {
  reviews: AdminReview[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  kpis: ReviewsKPIs;
}

export interface AdminReview {
  id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
  updated_at: string;
  id_hotel: string;
  nombre_hotel: string;
  id_usuario: string;
  nombre_usuario: string;
  nro_habitacion: number;
  tipo_habitacion: string;
  capacidad: number;
  id_reserva: string;
  fecha_ingreso: string;
  fecha_salida: string;
  nro_personas: number;
  duracion_noches: number;
  sentimiento: 'positive' | 'neutral' | 'negative';
}

export interface ReviewsKPIs {
  average_rating: number;
  total_reviews: number;
  reviews_with_comments: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_percentage: number;
  response_rate: number;
}

export interface ReviewsFilterParams {
  hotel_id?: string;
  rating?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  search?: string | null;
  page?: number;
  per_page?: number;
  sort_by?: 'created_at_desc' | 'created_at_asc' | 'rating_desc' | 'rating_asc';
}

export const SENTIMENT_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

export const SORT_BY_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'created_at_asc', label: 'Oldest First' },
  { value: 'rating_desc', label: 'Highest Rating' },
  { value: 'rating_asc', label: 'Lowest Rating' },
];

export const RATING_OPTIONS = [
  { value: null, label: 'All Ratings' },
  { value: 5, label: '★★★★★ 5 stars' },
  { value: 4, label: '★★★★☆ 4 stars' },
  { value: 3, label: '★★★☆☆ 3 stars' },
  { value: 2, label: '★★☆☆☆ 2 stars' },
  { value: 1, label: '★☆☆☆☆ 1 star' },
];
