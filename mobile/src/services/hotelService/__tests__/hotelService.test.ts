import HotelService, { HotelSearchParams, Hotel } from '../hotelService';
import customAxios from '@/utils/api';

jest.mock('@/utils/api');

const mockAxios = customAxios as jest.Mocked<typeof customAxios>;

describe('HotelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAvailableHotels', () => {
    const searchParams: HotelSearchParams = {
      busqueda: 'Bogota',
      fecha_ingreso: '2024-12-01',
      fecha_salida: '2024-12-05',
      nro_personas: 2,
    };

    const mockHotels: Hotel[] = [
      {
        hotel_id: 'hotel-1',
        nombre: 'Hotel Test',
        descripcion: 'A test hotel',
        email: 'test@hotel.com',
        ciudad: 'Bogota',
        pais: 'Colombia',
        amenidades: 'wifi,pool,parking',
        habitaciones: [
          {
            habitacion_id: 'room-1',
            tipo: 'Suite',
            nro_habitacion: 101,
            capacidad: 2,
            camas: 1,
          },
        ],
      },
      {
        hotel_id: 'hotel-2',
        nombre: 'Hotel Test 2',
        descripcion: 'Another test hotel',
        email: 'test2@hotel.com',
        ciudad: 'Bogota',
        pais: 'Colombia',
        amenidades: 'wifi,gym',
        habitaciones: [
          {
            habitacion_id: 'room-2',
            tipo: 'Standard',
            nro_habitacion: 201,
            capacidad: 3,
            camas: 2,
          },
        ],
      },
    ];

    it('should return hotels on successful search', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { hoteles: mockHotels },
      });

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/v1/hoteles/buscar-disponibles',
        searchParams
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHotels);
      expect(result.error).toBeUndefined();
    });

    it('should return empty array when no hotels found', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { hoteles: [] },
      });

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle missing hoteles property in response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error on non-200 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: { error: 'Bad request' },
      });

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to search hotels',
        status: 400,
      });
    });

    it('should return error on 500 response', async () => {
      mockAxios.post.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to search hotels',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.post.mockRejectedValue(networkError);

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.post.mockRejectedValue(error);

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Hotel search error',
      });
    });

    it('should handle timeout error', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      mockAxios.post.mockRejectedValue(timeoutError);

      const result = await HotelService.searchAvailableHotels(searchParams);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('getHotelById', () => {
    const hotelId = 'hotel-123';

    const mockHotel: Hotel = {
      hotel_id: 'hotel-123',
      nombre: 'Grand Hotel',
      descripcion: 'A luxurious hotel',
      email: 'grand@hotel.com',
      ciudad: 'Medellin',
      pais: 'Colombia',
      amenidades: 'wifi,pool,spa,gym',
      habitaciones: [
        {
          habitacion_id: 'room-1',
          tipo: 'Deluxe',
          nro_habitacion: 301,
          capacidad: 2,
          camas: 1,
        },
        {
          habitacion_id: 'room-2',
          tipo: 'Suite',
          nro_habitacion: 302,
          capacidad: 4,
          camas: 2,
        },
      ],
    };

    it('should return hotel on successful fetch', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHotel,
      });

      const result = await HotelService.getHotelById(hotelId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/api/v1/hoteles/${hotelId}`);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockHotel]);
      expect(result.error).toBeUndefined();
    });

    it('should return error on 404 not found', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: { error: 'Hotel not found' },
      });

      const result = await HotelService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hotel details',
        status: 404,
      });
    });

    it('should return error on 500 response', async () => {
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await HotelService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hotel details',
        status: 500,
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxios.get.mockRejectedValue(networkError);

      const result = await HotelService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Network Error',
      });
    });

    it('should handle error without message', async () => {
      const error = {};
      mockAxios.get.mockRejectedValue(error);

      const result = await HotelService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Get hotel error',
      });
    });

    it('should handle unauthorized error', async () => {
      mockAxios.get.mockResolvedValue({
        status: 401,
        data: { error: 'Unauthorized' },
      });

      const result = await HotelService.getHotelById(hotelId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Failed to get hotel details',
        status: 401,
      });
    });

    it('should use correct URL format for different hotel IDs', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockHotel,
      });

      await HotelService.getHotelById('abc-def-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/hoteles/abc-def-123');
    });
  });
});
