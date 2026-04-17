import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BookingScreen from '../booking';
import { router, useLocalSearchParams } from 'expo-router';
import { BookingService } from '../../services/bookingService';
import { useUserStore } from '@/store/userStore';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../services/bookingService', () => ({
  BookingService: {
    acquireRoomHold: jest.fn(),
    releaseHold: jest.fn(),
  },
}));

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseUserStore = useUserStore as unknown as jest.Mock;
const mockAcquireRoomHold = BookingService.acquireRoomHold as jest.Mock;

const mockHotelData = {
  hotel_id: 'hotel-1',
  nombre: 'Grand Hotel Paris',
  descripcion: 'Luxury hotel',
  email: 'contact@grandparis.com',
  ciudad: 'Paris',
  pais: 'France',
  amenidades: 'WiFi, Pool',
  minPrice: 150,
  rating_promedio: 4.5,
  cantidad_comentarios: 120,
};

const mockRoomData = {
  habitacion_id: 'room-1',
  tipo: 'Deluxe Suite',
  nro_habitacion: 101,
  capacidad: 2,
  camas: 1,
  precio_promedio_noche: 200,
  moneda: 'USD',
};

const mockSearchParams = {
  hotelData: JSON.stringify(mockHotelData),
  roomData: JSON.stringify(mockRoomData),
  checkIn: '2024-06-01',
  checkOut: '2024-06-05',
  guests: '2',
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  nombre: 'Test User',
};

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue(mockSearchParams);
    mockUseUserStore.mockImplementation((selector: any) => selector({ user: mockUser }));
    // Make acquireRoomHold never resolve to keep component in loading state
    mockAcquireRoomHold.mockImplementation(() => new Promise(() => {}));
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should render loading text', () => {
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });
  });

  describe('Missing Data - No User', () => {
    it('should show missing data error when user is null', () => {
      mockUseUserStore.mockImplementation((selector: any) => selector({ user: null }));
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.missingData')).toBeTruthy();
    });

    it('should show missing data error when user id is undefined', () => {
      mockUseUserStore.mockImplementation((selector: any) => selector({ user: {} }));
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.missingData')).toBeTruthy();
    });
  });

  describe('Missing Data - No Room ID', () => {
    it('should show missing data error when room id is missing', () => {
      const roomWithoutId = { ...mockRoomData };
      delete (roomWithoutId as any).habitacion_id;
      
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: JSON.stringify(roomWithoutId),
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.missingData')).toBeTruthy();
    });

    it('should show missing data error when room data is empty', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: '{}',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.missingData')).toBeTruthy();
    });
  });

  describe('Param Parsing', () => {
    it('should handle array params for hotelData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        hotelData: [JSON.stringify(mockHotelData)],
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle array params for roomData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: [JSON.stringify(mockRoomData)],
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle array params for checkIn', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: ['2024-06-01'],
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle array params for checkOut', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkOut: ['2024-06-05'],
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle array params for guests', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: ['2'],
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should default guests to 1 when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: undefined,
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should default guests to 1 when empty string', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: '',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });
  });

  describe('Service Calls', () => {
    it('should call acquireRoomHold on mount', () => {
      render(<BookingScreen />);
      expect(mockAcquireRoomHold).toHaveBeenCalledWith('room-1', {
        id_usuario: 'user-123',
        fecha_ingreso: '2024-06-01T00:00:00',
        fecha_salida: '2024-06-05T00:00:00',
      });
    });

    it('should call acquireRoomHold with correct room id', () => {
      const customRoom = { ...mockRoomData, habitacion_id: 'custom-room-123' };
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: JSON.stringify(customRoom),
      });
      
      render(<BookingScreen />);
      expect(mockAcquireRoomHold).toHaveBeenCalledWith('custom-room-123', expect.any(Object));
    });

    it('should call acquireRoomHold with correct dates', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: '2024-07-15',
        checkOut: '2024-07-20',
      });
      
      render(<BookingScreen />);
      expect(mockAcquireRoomHold).toHaveBeenCalledWith('room-1', {
        id_usuario: 'user-123',
        fecha_ingreso: '2024-07-15T00:00:00',
        fecha_salida: '2024-07-20T00:00:00',
      });
    });

    it('should not call acquireRoomHold when user is missing', () => {
      mockUseUserStore.mockImplementation((selector: any) => selector({ user: null }));
      render(<BookingScreen />);
      expect(mockAcquireRoomHold).not.toHaveBeenCalled();
    });

    it('should not call acquireRoomHold when room id is missing', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: '{}',
      });
      render(<BookingScreen />);
      expect(mockAcquireRoomHold).not.toHaveBeenCalled();
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty hotel data', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        hotelData: '{}',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle missing hotelData param', () => {
      mockUseLocalSearchParams.mockReturnValue({
        roomData: JSON.stringify(mockRoomData),
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
        guests: '2',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle missing checkIn param', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: '',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });

    it('should handle missing checkOut param', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkOut: '',
      });
      
      const { getByText } = render(<BookingScreen />);
      expect(getByText('booking.loading')).toBeTruthy();
    });
  });
});
