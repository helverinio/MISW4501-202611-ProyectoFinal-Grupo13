import BookingService, {
  AcquireHoldPayload,
  RoomHoldResponse,
  CreateReservaPayload,
  CreatedReservaResponse,
  ProcessPaymentResponse,
  EstadoResponse,
  CiudadResponse,
  PaisResponse,
  ReservaResponse,
  HabitacionResponse,
  HotelResponse,
} from '../bookingService';
import customAxios from '@/utils/api';

jest.mock('@/utils/api');

const mockAxios = customAxios as jest.Mocked<typeof customAxios>;

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('acquireRoomHold', () => {
    const habitacionId = 'room-123';
    const payload: AcquireHoldPayload = {
      id_usuario: 'user-456',
      fecha_ingreso: '2024-12-01',
      fecha_salida: '2024-12-05',
    };

    const mockHoldResponse: RoomHoldResponse = {
      id: 'hold-789',
      id_habitacion: 'room-123',
      id_usuario: 'user-456',
      fecha_ingreso: '2024-12-01',
      fecha_salida: '2024-12-05',
      created_at: '2024-11-15T10:00:00Z',
      expires_at: '2024-11-15T10:15:00Z',
    };

    it('should return hold on successful 200 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockHoldResponse,
      });

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `/api/v1/habitaciones/${habitacionId}/hold`,
        payload
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHoldResponse);
      expect(result.error).toBeUndefined();
    });

    it('should return hold on successful 201 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: mockHoldResponse,
      });

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHoldResponse);
    });

    it('should return error on non-success response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: { error: 'Bad request' },
      });

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to acquire room hold',
        status: 400,
      });
    });

    it('should return error on 409 conflict response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 409,
        data: { error: 'Room already held' },
      });

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to acquire room hold',
        status: 409,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.post.mockRejectedValue(networkError);

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle axios error with response data', async () => {
      const axiosError = {
        response: {
          status: 409,
          data: { error: 'Room is already held by another user' },
        },
        message: 'Request failed',
      };
      mockAxios.post.mockRejectedValue(axiosError);

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Room is already held by another user',
        status: 409,
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.post.mockRejectedValue(error);

      const result = await BookingService.acquireRoomHold(habitacionId, payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to acquire room hold',
      });
    });
  });

  describe('releaseHold', () => {
    const holdId = 'hold-789';

    it('should return success on hold release', async () => {
      mockAxios.delete.mockResolvedValue({
        status: 200,
      });

      const result = await BookingService.releaseHold(holdId);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/api/v1/holds/${holdId}`);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return success on 204 no content', async () => {
      mockAxios.delete.mockResolvedValue({
        status: 204,
      });

      const result = await BookingService.releaseHold(holdId);

      expect(result.success).toBe(true);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.delete.mockRejectedValue(networkError);

      const result = await BookingService.releaseHold(holdId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.delete.mockRejectedValue(error);

      const result = await BookingService.releaseHold(holdId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to release hold',
      });
    });

    it('should handle 404 not found error', async () => {
      const notFoundError = {
        response: { status: 404 },
        message: 'Hold not found',
      };
      mockAxios.delete.mockRejectedValue(notFoundError);

      const result = await BookingService.releaseHold(holdId);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Hold not found');
    });
  });

  describe('getEstados', () => {
    const mockEstados: EstadoResponse[] = [
      { id: 'estado-1', nombre: 'Pendiente' },
      { id: 'estado-2', nombre: 'Confirmada' },
      { id: 'estado-3', nombre: 'Cancelada' },
    ];

    it('should return estados on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockEstados,
      });

      const result = await BookingService.getEstados();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/estados');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEstados);
      expect(result.error).toBeUndefined();
    });

    it('should return empty array when no estados', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      const result = await BookingService.getEstados();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await BookingService.getEstados();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get estados',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.get.mockRejectedValue(networkError);

      const result = await BookingService.getEstados();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.get.mockRejectedValue(error);

      const result = await BookingService.getEstados();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get estados',
      });
    });
  });

  describe('getCiudadById', () => {
    const ciudadId = 'ciudad-123';

    const mockCiudad: CiudadResponse = {
      id: 'ciudad-123',
      nombre: 'Bogota',
      id_pais: 'pais-001',
    };

    it('should return ciudad on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockCiudad,
      });

      const result = await BookingService.getCiudadById(ciudadId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/ciudades/${ciudadId}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCiudad);
      expect(result.error).toBeUndefined();
    });

    it('should return error on 404 not found', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: { error: 'Ciudad not found' },
      });

      const result = await BookingService.getCiudadById(ciudadId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get ciudad',
        status: 404,
      });
    });

    it('should return error on 500 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await BookingService.getCiudadById(ciudadId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get ciudad',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.get.mockRejectedValue(networkError);

      const result = await BookingService.getCiudadById(ciudadId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.get.mockRejectedValue(error);

      const result = await BookingService.getCiudadById(ciudadId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get ciudad',
      });
    });
  });

  describe('getPaises', () => {
    const mockPaises: PaisResponse[] = [
      { id: 'pais-001', nombre: 'Colombia' },
      { id: 'pais-002', nombre: 'Peru' },
      { id: 'pais-003', nombre: 'Ecuador' },
    ];

    it('should return paises on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockPaises,
      });

      const result = await BookingService.getPaises();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/paises');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaises);
      expect(result.error).toBeUndefined();
    });

    it('should return empty array when no paises', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: [],
      });

      const result = await BookingService.getPaises();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await BookingService.getPaises();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get paises',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.get.mockRejectedValue(networkError);

      const result = await BookingService.getPaises();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.get.mockRejectedValue(error);

      const result = await BookingService.getPaises();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get paises',
      });
    });
  });

  describe('createReserva', () => {
    const payload: CreateReservaPayload = {
      fecha_ingreso: '2024-12-01',
      fecha_salida: '2024-12-05',
      total: 500000,
      nro_personas: 2,
      id_usuario: 'user-456',
      id_pais: 'pais-001',
      id_habitacion: 'room-123',
      id_estado: 'estado-1',
      payment_method: 'card',
    };

    const mockReservaResponse: CreatedReservaResponse = {
      id: 'reserva-999',
      fecha_ingreso: '2024-12-01',
      fecha_salida: '2024-12-05',
      total: 500000,
      nro_personas: 2,
      id_usuario: 'user-456',
      id_pais: 'pais-001',
      id_habitacion: 'room-123',
      id_estado: 'estado-1',
      payment: {
        payment_id: 'payment-111',
        payment_intent_id: 'pi_abc123',
        payment_status: 'pending',
      },
    };

    it('should return reserva on successful 200 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockReservaResponse,
      });

      const result = await BookingService.createReserva(payload);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/reservas', payload);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReservaResponse);
      expect(result.error).toBeUndefined();
    });

    it('should return reserva on successful 201 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: mockReservaResponse,
      });

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReservaResponse);
    });

    it('should handle reserva without payment info', async () => {
      const responseWithoutPayment: CreatedReservaResponse = {
        ...mockReservaResponse,
        payment: null,
      };
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: responseWithoutPayment,
      });

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(true);
      expect(result.data?.payment).toBeNull();
    });

    it('should return error on non-success response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: { error: 'Invalid dates' },
      });

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to create reservation',
        status: 400,
      });
    });

    it('should return error on 409 conflict', async () => {
      mockAxios.post.mockResolvedValue({
        status: 409,
        data: { error: 'Room not available' },
      });

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to create reservation',
        status: 409,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.post.mockRejectedValue(networkError);

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle axios error with response data', async () => {
      const axiosError = {
        response: {
          status: 422,
          data: { error: 'Validation failed: dates overlap with existing reservation' },
        },
        message: 'Request failed',
      };
      mockAxios.post.mockRejectedValue(axiosError);

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Validation failed: dates overlap with existing reservation',
        status: 422,
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.post.mockRejectedValue(error);

      const result = await BookingService.createReserva(payload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to create reservation',
      });
    });

    it('should handle different payment methods', async () => {
      const psePayload: CreateReservaPayload = {
        ...payload,
        payment_method: 'pse',
      };
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: mockReservaResponse,
      });

      await BookingService.createReserva(psePayload);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/reservas', psePayload);
    });
  });

  describe('processPayment', () => {
    const paymentId = 'payment-111';

    const mockPaymentResponse: ProcessPaymentResponse = {
      id: 'payment-111',
      payment_intent_id: 'pi_abc123',
      status: 'succeeded',
      amount: 500000,
      currency: 'COP',
    };

    it('should return payment result on successful 200 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockPaymentResponse,
      });

      const result = await BookingService.processPayment(paymentId);

      expect(mockAxios.post).toHaveBeenCalledWith(`/api/v1/payments/${paymentId}/process`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentResponse);
      expect(result.error).toBeUndefined();
    });

    it('should return payment result on successful 201 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: mockPaymentResponse,
      });

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentResponse);
    });

    it('should handle payment with pending status', async () => {
      const pendingPayment: ProcessPaymentResponse = {
        ...mockPaymentResponse,
        status: 'pending',
      };
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: pendingPayment,
      });

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
    });

    it('should handle payment with failed status', async () => {
      const failedPayment: ProcessPaymentResponse = {
        ...mockPaymentResponse,
        status: 'failed',
      };
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: failedPayment,
      });

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('failed');
    });

    it('should return error on non-success response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: { error: 'Invalid payment' },
      });

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to process payment',
        status: 400,
      });
    });

    it('should return error on 404 not found', async () => {
      mockAxios.post.mockResolvedValue({
        status: 404,
        data: { error: 'Payment not found' },
      });

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to process payment',
        status: 404,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.post.mockRejectedValue(networkError);

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle axios error with response data', async () => {
      const axiosError = {
        response: {
          status: 402,
          data: { error: 'Insufficient funds' },
        },
        message: 'Request failed',
      };
      mockAxios.post.mockRejectedValue(axiosError);

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Insufficient funds',
        status: 402,
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.post.mockRejectedValue(error);

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to process payment',
      });
    });

    it('should handle timeout error', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      mockAxios.post.mockRejectedValue(timeoutError);

      const result = await BookingService.processPayment(paymentId);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('getHabitaciones', () => {
    const mockHabitaciones: HabitacionResponse[] = [
      {
        id: 'hab-1',
        tipo: 'Suite',
        nro_habitacion: 101,
        capacidad: 2,
        camas: 1,
        id_hotel: 'hotel-1',
      },
    ];

    it('should return habitaciones on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHabitaciones,
      });

      const result = await BookingService.getHabitaciones();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/habitaciones');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHabitaciones);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 503,
        data: { error: 'Service unavailable' },
      });

      const result = await BookingService.getHabitaciones();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get habitaciones',
        status: 503,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await BookingService.getHabitaciones();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should fallback to default message when error has no message', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getHabitaciones();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get habitaciones',
      });
    });
  });

  describe('getHoteles', () => {
    const mockHoteles: HotelResponse[] = [
      {
        id: 'hotel-1',
        nombre: 'Hotel Sunset',
        descripcion: 'Ocean view',
        email: 'contact@sunset.com',
        id_ciudad: 'city-1',
      },
    ];

    it('should return hoteles on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHoteles,
      });

      const result = await BookingService.getHoteles();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/hoteles');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHoteles);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await BookingService.getHoteles();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hoteles',
        status: 500,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getHoteles();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hoteles',
      });
    });
  });

  describe('getCiudades', () => {
    const mockCiudades: CiudadResponse[] = [
      { id: 'city-1', nombre: 'Bogota', id_pais: 'pais-1' },
    ];

    it('should return ciudades on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockCiudades,
      });

      const result = await BookingService.getCiudades();

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/ciudades');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCiudades);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 403,
        data: { error: 'Forbidden' },
      });

      const result = await BookingService.getCiudades();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get ciudades',
        status: 403,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await BookingService.getCiudades();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should fallback to default message when error has no message', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getCiudades();

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get ciudades',
      });
    });
  });

  describe('getReservasByUsuario', () => {
    const usuarioId = 'user-1';
    const mockReservas: ReservaResponse[] = [
      {
        id: 'res-1',
        fecha_ingreso: '2026-04-20',
        fecha_salida: '2026-04-22',
        total: 250000,
        nro_personas: 2,
        id_usuario: usuarioId,
        id_pais: 'pais-1',
        id_habitacion: 'hab-1',
        id_estado: 'estado-1',
      },
    ];

    it('should return reservas on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockReservas,
      });

      const result = await BookingService.getReservasByUsuario(usuarioId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/usuarios/${usuarioId}/reservas`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReservas);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: { error: 'Not found' },
      });

      const result = await BookingService.getReservasByUsuario(usuarioId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get reservations',
        status: 404,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getReservasByUsuario(usuarioId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get reservations',
      });
    });
  });

  describe('getHabitacionById', () => {
    const habitacionId = 'hab-1';
    const mockHabitacion: HabitacionResponse = {
      id: habitacionId,
      tipo: 'Doble',
      nro_habitacion: 202,
      capacidad: 4,
      camas: 2,
      id_hotel: 'hotel-1',
    };

    it('should return habitacion on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHabitacion,
      });

      const result = await BookingService.getHabitacionById(habitacionId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/habitaciones/${habitacionId}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHabitacion);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 400,
        data: { error: 'Bad request' },
      });

      const result = await BookingService.getHabitacionById(habitacionId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get habitacion',
        status: 400,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getHabitacionById(habitacionId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get habitacion',
      });
    });
  });

  describe('getHotelById', () => {
    const hotelId = 'hotel-1';
    const mockHotel: HotelResponse = {
      id: hotelId,
      nombre: 'Hotel Sunset',
      descripcion: 'Ocean view',
      email: 'contact@sunset.com',
      id_ciudad: 'city-1',
    };

    it('should return hotel on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHotel,
      });

      const result = await BookingService.getHotelById(hotelId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/hoteles/${hotelId}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHotel);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: { error: 'Not found' },
      });

      const result = await BookingService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hotel',
        status: 404,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      const result = await BookingService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should fallback to default message when error has no message', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hotel',
      });
    });
  });

  describe('getPaisById', () => {
    const paisId = 'pais-1';
    const mockPais: PaisResponse = {
      id: paisId,
      nombre: 'Colombia',
    };

    it('should return pais on successful response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockPais,
      });

      const result = await BookingService.getPaisById(paisId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/paises/${paisId}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPais);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 403,
        data: { error: 'Forbidden' },
      });

      const result = await BookingService.getPaisById(paisId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get pais',
        status: 403,
      });
    });

    it('should handle thrown error', async () => {
      mockAxios.get.mockRejectedValue({});

      const result = await BookingService.getPaisById(paisId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get pais',
      });
    });
  });

  describe('updateReserva', () => {
    const reservaId = 'res-1';
    const updatePayload: Partial<ReservaResponse> = {
      id_estado: 'estado-2',
      total: 300000,
    };

    const updatedReserva: ReservaResponse = {
      id: reservaId,
      fecha_ingreso: '2026-04-20',
      fecha_salida: '2026-04-22',
      total: 300000,
      nro_personas: 2,
      id_usuario: 'user-1',
      id_pais: 'pais-1',
      id_habitacion: 'hab-1',
      id_estado: 'estado-2',
    };

    it('should update reservation on successful response', async () => {
      mockAxios.put.mockResolvedValue({
        status: 200,
        data: updatedReserva,
      });

      const result = await BookingService.updateReserva(reservaId, updatePayload);

      expect(mockAxios.put).toHaveBeenCalledWith(`/api/v1/reservas/${reservaId}`, updatePayload);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedReserva);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.put.mockResolvedValue({
        status: 409,
        data: { error: 'Conflict' },
      });

      const result = await BookingService.updateReserva(reservaId, updatePayload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to update reservation',
        status: 409,
      });
    });

    it('should handle axios error with response data', async () => {
      mockAxios.put.mockRejectedValue({
        response: {
          status: 422,
          data: { error: 'Validation failed' },
        },
        message: 'Request failed',
      });

      const result = await BookingService.updateReserva(reservaId, updatePayload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Validation failed',
        status: 422,
      });
    });

    it('should fallback to default message when rejected error has no message and no response error', async () => {
      mockAxios.put.mockRejectedValue({ response: {} });

      const result = await BookingService.updateReserva(reservaId, updatePayload);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to update reservation',
      });
    });
  });
});
