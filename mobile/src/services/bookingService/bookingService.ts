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

export interface ProcessPaymentResponse {
  id: string;
  payment_intent_id: string;
  status: string;
  amount: number;
  currency: string;
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

export interface PaisResponse {
  id: string;
  nombre: string;
}

export interface ReservaResponse {
  id: string;
  fecha_ingreso: string;
  fecha_salida: string;
  total: number;
  nro_personas: number;
  id_usuario: string;
  id_pais: string;
  id_habitacion: string;
  id_estado: string;
}

export interface HabitacionResponse {
  id: string;
  tipo: string;
  nro_habitacion: number;
  capacidad: number;
  camas: number;
  id_hotel: string;
}

export interface HotelResponse {
  id: string;
  nombre: string;
  descripcion: string;
  email: string;
  id_ciudad: string;
  rating_promedio?: number;
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

  getPaises: async (): Promise<BookingServiceResult<PaisResponse[]>> => {
    try {
      const url = '/api/v1/paises';
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
          message: 'Failed to get paises',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get paises error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get paises',
        },
      };
    }
  },

  getHabitaciones: async (): Promise<BookingServiceResult<HabitacionResponse[]>> => {
    try {
      const url = '/api/v1/habitaciones';
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
          message: 'Failed to get habitaciones',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get habitaciones error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get habitaciones',
        },
      };
    }
  },

  getHoteles: async (): Promise<BookingServiceResult<HotelResponse[]>> => {
    try {
      const url = '/api/v1/hoteles';
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
          message: 'Failed to get hoteles',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get hoteles error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get hoteles',
        },
      };
    }
  },

  getCiudades: async (): Promise<BookingServiceResult<CiudadResponse[]>> => {
    try {
      const url = '/api/v1/ciudades';
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
          message: 'Failed to get ciudades',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get ciudades error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get ciudades',
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

  processPayment: async (
    paymentId: string
  ): Promise<BookingServiceResult<ProcessPaymentResponse>> => {
    try {
      const url = `/api/v1/payments/${paymentId}/process`;
      const response = await customAxios.post(url);

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to process payment',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Process payment error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error || error.message || 'Failed to process payment',
          status: error.response?.status,
        },
      };
    }
  },

  getReservasByUsuario: async (
    usuarioId: string
  ): Promise<BookingServiceResult<ReservaResponse[]>> => {
    try {
      const url = `/api/v1/usuarios/${usuarioId}/reservas`;
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
          message: 'Failed to get reservations',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get reservations error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get reservations',
        },
      };
    }
  },

  getHabitacionById: async (
    habitacionId: string
  ): Promise<BookingServiceResult<HabitacionResponse>> => {
    try {
      const url = `/api/v1/habitaciones/${habitacionId}`;
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
          message: 'Failed to get habitacion',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get habitacion error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get habitacion',
        },
      };
    }
  },

  getHotelById: async (
    hotelId: string
  ): Promise<BookingServiceResult<HotelResponse>> => {
    try {
      const url = `/api/v1/hoteles/${hotelId}`;
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
          message: 'Failed to get hotel',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get hotel error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get hotel',
        },
      };
    }
  },

  getPaisById: async (
    paisId: string
  ): Promise<BookingServiceResult<PaisResponse>> => {
    try {
      const url = `/api/v1/paises/${paisId}`;
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
          message: 'Failed to get pais',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Get pais error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get pais',
        },
      };
    }
  },

  updateReserva: async (
    reservaId: string,
    payload: Partial<ReservaResponse>
  ): Promise<BookingServiceResult<ReservaResponse>> => {
    try {
      const url = `/api/v1/reservas/${reservaId}`;
      const response = await customAxios.put(url, payload);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to update reservation',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Update reservation error:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error || error.message || 'Failed to update reservation',
          status: error.response?.status,
        },
      };
    }
  },
};

export default BookingService;
