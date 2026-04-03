import customAxios from '@/utils/api';

export interface HotelSearchParams {
  busqueda: string;
  fecha_ingreso: string;
  fecha_salida: string;
  nro_personas: number;
}

export interface Hotel {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  rating: number;
  num_reviews: number;
  precio_noche: number;
  distancia_centro: number;
  imagen_url?: string;
  amenidades: string[];
  cancelacion_gratis: boolean;
}

export interface HotelSearchResult {
  success: boolean;
  data?: Hotel[];
  error?: {
    message: string;
    status?: number;
  };
}

export const HotelService = {
  searchAvailableHotels: async (params: HotelSearchParams): Promise<HotelSearchResult> => {
    try {
      const url = '/api/v1/hoteles/buscar-disponibles';

      const response = await customAxios.post(url, params);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to search hotels',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Hotel search error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Hotel search error',
        },
      };
    }
  },

  getHotelById: async (hotelId: string): Promise<HotelSearchResult> => {
    try {
      const url = `/api/v1/hoteles/${hotelId}`;

      const response = await customAxios.get(url);

      if (response.status === 200) {
        return {
          success: true,
          data: [response.data],
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to get hotel details',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get hotel error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Get hotel error',
        },
      };
    }
  },
};

export default HotelService;
