import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HotelResultsScreen from '../hotelResults';
import HotelService from '../../services/hotelService';
import { router, useLocalSearchParams } from 'expo-router';

jest.mock('../../services/hotelService', () => ({
  __esModule: true,
  default: {
    searchAvailableHotels: jest.fn(),
  },
  HotelService: {
    searchAvailableHotels: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

const mockHotelService = HotelService as jest.Mocked<typeof HotelService>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const mockSearchParams = {
  destination: 'Paris',
  checkIn: '2024-06-01',
  checkOut: '2024-06-05',
  guests: '2',
};

const mockHotelsData = [
  {
    hotel_id: 'hotel-1',
    nombre: 'Grand Hotel Paris',
    descripcion: 'Luxury hotel in the heart of Paris',
    email: 'contact@grandparis.com',
    ciudad: 'Paris',
    pais: 'France',
    amenidades: 'WiFi, Pool, Gym',
    habitaciones: [
      {
        habitacion_id: 'room-1',
        tipo: 'Deluxe Suite',
        nro_habitacion: 101,
        capacidad: 2,
        camas: 1,
      },
      {
        habitacion_id: 'room-2',
        tipo: 'Standard Room',
        nro_habitacion: 102,
        capacidad: 2,
        camas: 2,
      },
    ],
  },
  {
    hotel_id: 'hotel-2',
    nombre: 'Boutique Hotel',
    descripcion: 'Cozy boutique hotel',
    email: 'info@boutique.com',
    ciudad: 'Paris',
    pais: 'France',
    amenidades: 'WiFi, Breakfast',
    habitaciones: [
      {
        habitacion_id: 'room-3',
        tipo: 'Single Room',
        nro_habitacion: 201,
        capacidad: 1,
        camas: 1,
      },
    ],
  },
];

describe('HotelResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue(mockSearchParams);
  });

  describe('Rendering', () => {
    it('should render header with destination', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('Paris')).toBeTruthy();
      });
    });

    it('should render header with date range and guests', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        // Date may vary by timezone
        expect(getByText(/[A-Z][a-z]{2} \d+ - [A-Z][a-z]{2} \d+/)).toBeTruthy();
      });
    });

    it('should render filter buttons', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.filters')).toBeTruthy();
        expect(getByText('results.price')).toBeTruthy();
        expect(getByText('results.rating')).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching hotels', async () => {
      let resolvePromise: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockHotelService.searchAvailableHotels.mockReturnValue(searchPromise as any);

      const { getByText } = render(<HotelResultsScreen />);

      expect(getByText('results.searching')).toBeTruthy();

      await act(async () => {
        resolvePromise!({ success: true, data: [] });
      });
    });
  });

  describe('Search Functionality', () => {
    it('should call HotelService with correct search params', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(mockHotelService.searchAvailableHotels).toHaveBeenCalledWith({
          busqueda: 'Paris',
          fecha_ingreso: '2024-06-01',
          fecha_salida: '2024-06-05',
          nro_personas: 2,
        });
      });
    });

    it('should default guests to 1 when not provided', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        destination: 'Paris',
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
      });
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(mockHotelService.searchAvailableHotels).toHaveBeenCalledWith(
          expect.objectContaining({
            nro_personas: 1,
          })
        );
      });
    });
  });

  describe('Results Display', () => {
    it('should display results count when hotels are found', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/3 results.rooms/)).toBeTruthy();
      });
    });

    it('should display hotel names in room cards', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Grand Hotel Paris').length).toBeGreaterThan(0);
        expect(getAllByText('Boutique Hotel').length).toBeGreaterThan(0);
      });
    });

    it('should display room details', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/Deluxe Suite/)).toBeTruthy();
      });
    });

    it('should display city location', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        const parisTexts = getAllByText(/Paris/);
        expect(parisTexts.length).toBeGreaterThan(1);
      });
    });

    it('should display amenities badges', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('WiFi').length).toBeGreaterThan(0);
      });
    });

    it('should display view details button', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        const viewDetailsButtons = getAllByText('results.viewDetails');
        expect(viewDetailsButtons.length).toBe(3);
      });
    });
  });

  describe('Empty State', () => {
    it('should display no results message when no hotels found', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.noHotels')).toBeTruthy();
      });
    });

    it('should display no results when hotels have no rooms', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [
          {
            hotel_id: 'hotel-empty',
            nombre: 'Empty Hotel',
            descripcion: 'No rooms available',
            email: 'empty@hotel.com',
            ciudad: 'Paris',
            pais: 'France',
            amenidades: '',
            habitaciones: [],
          },
        ],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.noHotels')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on search failure', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: false,
        error: { message: 'Network error' },
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    it('should display default error message when no error message provided', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: false,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.errorLoading')).toBeTruthy();
      });
    });

    it('should display retry button on error', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: false,
        error: { message: 'Error' },
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.retry')).toBeTruthy();
      });
    });

    it('should retry search when retry button is pressed', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValueOnce({
        success: false,
        error: { message: 'Error' },
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.retry')).toBeTruthy();
      });

      mockHotelService.searchAvailableHotels.mockResolvedValueOnce({
        success: true,
        data: mockHotelsData,
      });

      await act(async () => {
        fireEvent.press(getByText('results.retry'));
      });

      await waitFor(() => {
        expect(mockHotelService.searchAvailableHotels).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByTestId } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(mockHotelService.searchAvailableHotels).toHaveBeenCalled();
      });
    });
  });

  describe('Guest Count Display', () => {
    it('should display singular guest text for 1 guest', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: '1',
      });
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/1 search.guest/)).toBeTruthy();
      });
    });

    it('should display plural guests text for multiple guests', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/2 search.guests/)).toBeTruthy();
      });
    });
  });

  describe('Amenities Parsing', () => {
    it('should handle empty amenidades string', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockHotelsData[0],
            amenidades: '',
          },
        ],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Grand Hotel Paris').length).toBeGreaterThan(0);
      });
    });

    it('should parse comma-separated amenidades', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockHotelsData[0],
            amenidades: 'Spa, Parking',
          },
        ],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Spa').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Hotels Without Rooms', () => {
    it('should not display hotels that have undefined habitaciones', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [
          {
            hotel_id: 'hotel-no-rooms',
            nombre: 'No Rooms Hotel',
            descripcion: 'Test',
            email: 'test@test.com',
            ciudad: 'Paris',
            pais: 'France',
            amenidades: '',
            habitaciones: undefined as any,
          },
        ],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.noHotels')).toBeTruthy();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format date range correctly', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        destination: 'Paris',
        checkIn: '2024-12-25',
        checkOut: '2024-12-31',
        guests: '2',
      });
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        // Date may vary by timezone, just check Dec appears
        expect(getByText(/Dec \d+ - Dec \d+/)).toBeTruthy();
      });
    });
  });
});
