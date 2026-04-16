import customAxios from '@/utils/api';

export interface AcquireHoldPayload {
  id_usuario: string;
  fecha_ingreso: string;
  fecha_salida: string;
}

export interface RoomHoldResponse {
  id: string;
  id_habitacion: string;
  id_usuario: string;
  fecha_ingreso: string;
  fecha_salida: string;
  created_at: string;
  expires_at: string;
}

export interface CreateReservaPayload {
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
  payment_method: 'card' | 'pse' | 'transfer';
}

export interface CreatedReservaResponse {
  id: string;
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
  payment?: {
    payment_id?: string | null;
    payment_intent_id?: string | null;
    payment_status?: string | null;
  } | null;
}

export interface EstadoResponse {
  id: string;
  nombre: string;
}

export interface CiudadResponse {
  id: string;
  nombre: string;
  id_pais: string;
}

export interface BookingServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

export const BookingService = {
  acquireRoomHold: async (
    habitacionId: string,
    payload: AcquireHoldPayload
  ): Promise<BookingServiceResult<RoomHoldResponse>> => {
    try {
      const url = `/api/v1/habitaciones/${habitacionId}/hold`;
      const response = await customAxios.post(url, payload);

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to acquire room hold',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Acquire hold error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error || error.message || 'Failed to acquire room hold',
          status: error.response?.status,
        },
      };
    }
  },

  releaseHold: async (holdId: string): Promise<BookingServiceResult<void>> => {
    try {
      const url = `/api/v1/holds/${holdId}`;
      await customAxios.delete(url);
      return { success: true };
    } catch (error: any) {
      console.error('Release hold error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to release hold',
        },
      };
    }
  },

  getEstados: async (): Promise<BookingServiceResult<EstadoResponse[]>> => {
    try {
      const url = '/api/v1/estados';
      const response = await customAxios.get(url);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to get estados',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get estados error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get estados',
        },
      };
    }
  },

  getCiudadById: async (ciudadId: string): Promise<BookingServiceResult<CiudadResponse>> => {
    try {
      const url = `/api/v1/ciudades/${ciudadId}`;
      const response = await customAxios.get(url);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to get ciudad',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get ciudad error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get ciudad',
        },
      };
    }
  },

  createReserva: async (
    payload: CreateReservaPayload
  ): Promise<BookingServiceResult<CreatedReservaResponse>> => {
    try {
      const url = '/api/v1/reservas';
      const response = await customAxios.post(url, payload);

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to create reservation',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Create reserva error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error || error.message || 'Failed to create reservation',
          status: error.response?.status,
        },
      };
    }
  },
};

export default BookingService;
