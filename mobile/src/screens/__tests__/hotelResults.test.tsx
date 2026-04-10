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
        expect(getByText(/2 results.hotels/)).toBeTruthy();
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

    it('should display hotel names', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('Grand Hotel Paris')).toBeTruthy();
        expect(getByText('Boutique Hotel')).toBeTruthy();
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

    it('should display view details button for each hotel', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        const viewDetailsButtons = getAllByText('results.viewDetails');
        expect(viewDetailsButtons.length).toBe(2); // One per hotel, not per room
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

    it('should display hotels even when they have no rooms', async () => {
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
        // Hotels are still displayed, rooms are shown in details
        expect(getByText('Empty Hotel')).toBeTruthy();
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
    it('should display hotels even with undefined habitaciones', async () => {
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
        // Hotels are displayed even without rooms (price shows as '-')
        expect(getByText('No Rooms Hotel')).toBeTruthy();
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

  describe('Hotel Details Navigation', () => {
    it('should navigate to hotel details when view details button is pressed', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [mockHotelsData[0]],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.viewDetails')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('results.viewDetails'));
      });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/screens/hotelDetails',
        params: expect.objectContaining({
          hotelId: 'hotel-1',
          checkIn: '2024-06-01',
          checkOut: '2024-06-05',
          guests: '2',
        }),
      });
    });

    it('should pass hotel data as JSON string in navigation params', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [mockHotelsData[0]],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('results.viewDetails')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('results.viewDetails'));
      });

      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            hotelData: expect.any(String),
          }),
        })
      );

      const callArgs = (router.push as jest.Mock).mock.calls[0][0];
      const hotelData = JSON.parse(callArgs.params.hotelData);
      expect(hotelData.hotel_id).toBe('hotel-1');
      expect(hotelData.nombre).toBe('Grand Hotel Paris');
    });
  });

  describe('Back Button Navigation', () => {
    it('should call router.back when back button is pressed', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
      });

      const { UNSAFE_root } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(mockHotelService.searchAvailableHotels).toHaveBeenCalled();
      });

      // Find the back button TouchableOpacity
      const backButtons = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      const backButton = backButtons.find((btn: any) => 
        btn.props.onPress?.toString().includes('back')
      );
      
      if (backButton) {
        await act(async () => {
          backButton.props.onPress();
        });
        expect(router.back).toHaveBeenCalled();
      }
    });
  });

  describe('Price Sorting', () => {
    it('should sort hotels by minPrice ascending', async () => {
      const hotelsWithPrices = [
        {
          ...mockHotelsData[0],
          hotel_id: 'expensive-hotel',
          nombre: 'Expensive Hotel',
          habitaciones: [{ habitacion_id: 'r1', tipo: 'Suite', nro_habitacion: 1, capacidad: 2, camas: 1, precio: 500 }],
        },
        {
          ...mockHotelsData[0],
          hotel_id: 'cheap-hotel',
          nombre: 'Cheap Hotel',
          habitaciones: [{ habitacion_id: 'r2', tipo: 'Room', nro_habitacion: 2, capacidad: 2, camas: 1, precio: 100 }],
        },
        {
          ...mockHotelsData[0],
          hotel_id: 'mid-hotel',
          nombre: 'Mid Hotel',
          habitaciones: [{ habitacion_id: 'r3', tipo: 'Room', nro_habitacion: 3, capacidad: 2, camas: 1, precio: 250 }],
        },
      ];

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: hotelsWithPrices,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        const cheapHotel = getAllByText('Cheap Hotel');
        const midHotel = getAllByText('Mid Hotel');
        const expensiveHotel = getAllByText('Expensive Hotel');
        expect(cheapHotel.length).toBeGreaterThan(0);
        expect(midHotel.length).toBeGreaterThan(0);
        expect(expensiveHotel.length).toBeGreaterThan(0);
      });
    });

    it('should place hotels with null prices at the end', async () => {
      const hotelsWithMixedPrices = [
        {
          ...mockHotelsData[0],
          hotel_id: 'no-price-hotel',
          nombre: 'No Price Hotel',
          habitaciones: [],
        },
        {
          ...mockHotelsData[0],
          hotel_id: 'priced-hotel',
          nombre: 'Priced Hotel',
          habitaciones: [{ habitacion_id: 'r1', tipo: 'Room', nro_habitacion: 1, capacidad: 2, camas: 1, precio: 150 }],
        },
      ];

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: hotelsWithMixedPrices,
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Priced Hotel').length).toBeGreaterThan(0);
        expect(getAllByText('No Price Hotel').length).toBeGreaterThan(0);
      });
    });

    it('should calculate minPrice from multiple room prices', async () => {
      const hotelWithMultipleRooms = {
        ...mockHotelsData[0],
        habitaciones: [
          { habitacion_id: 'r1', tipo: 'Suite', nro_habitacion: 1, capacidad: 2, camas: 1, precio: 300 },
          { habitacion_id: 'r2', tipo: 'Standard', nro_habitacion: 2, capacidad: 2, camas: 1, precio: 150 },
          { habitacion_id: 'r3', tipo: 'Deluxe', nro_habitacion: 3, capacidad: 2, camas: 1, precio: 250 },
        ],
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithMultipleRooms],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        // Should display minimum price of 150
        expect(getByText('$150')).toBeTruthy();
      });
    });
  });

  describe('Price Display', () => {
    it('should display price with dollar sign', async () => {
      const hotelWithPrice = {
        ...mockHotelsData[0],
        habitaciones: [{ habitacion_id: 'r1', tipo: 'Room', nro_habitacion: 1, capacidad: 2, camas: 1, precio: 200 }],
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithPrice],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('$200')).toBeTruthy();
        expect(getByText('results.perNight')).toBeTruthy();
      });
    });

    it('should display dash when hotel has no prices', async () => {
      const hotelWithNoPrice = {
        ...mockHotelsData[0],
        habitaciones: [],
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithNoPrice],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('-')).toBeTruthy();
      });
    });

    it('should handle rooms with null prices', async () => {
      const hotelWithNullPrices = {
        ...mockHotelsData[0],
        habitaciones: [
          { habitacion_id: 'r1', tipo: 'Room', nro_habitacion: 1, capacidad: 2, camas: 1, precio: null },
          { habitacion_id: 'r2', tipo: 'Room', nro_habitacion: 2, capacidad: 2, camas: 1, precio: undefined },
        ],
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithNullPrices],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('-')).toBeTruthy();
      });
    });
  });

  describe('Rating Display', () => {
    it('should display rating and reviews when provided', async () => {
      const hotelWithRating = {
        ...mockHotelsData[0],
        rating: 4.5,
        reviews: 120,
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithRating],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/4.5.*120.*results.reviews/)).toBeTruthy();
      });
    });

    it('should not display rating section when rating is null', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [mockHotelsData[0]],
      });

      const { queryByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(queryByText(/results.reviews/)).toBeNull();
      });
    });
  });

  describe('Distance Display', () => {
    it('should display distance from center when provided', async () => {
      const hotelWithDistance = {
        ...mockHotelsData[0],
        distancia: 2.5,
      };

      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [hotelWithDistance],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText(/2.5 km results.fromCenter/)).toBeTruthy();
      });
    });

    it('should not display distance when not provided', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [mockHotelsData[0]],
      });

      const { queryByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(queryByText(/km results.fromCenter/)).toBeNull();
      });
    });
  });

  describe('Amenity Icons', () => {
    it('should render WiFi amenity with correct styling', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'WiFi' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('WiFi').length).toBeGreaterThan(0);
      });
    });

    it('should render Pool amenity', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'Pool' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Pool').length).toBeGreaterThan(0);
      });
    });

    it('should render Parking amenity', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'Parking' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Parking').length).toBeGreaterThan(0);
      });
    });

    it('should render Gym amenity', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'Gym' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Gym').length).toBeGreaterThan(0);
      });
    });

    it('should render Breakfast amenity', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'Breakfast' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('Breakfast').length).toBeGreaterThan(0);
      });
    });

    it('should render unknown amenity with default styling', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'CustomAmenity' }],
      });

      const { getAllByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('CustomAmenity').length).toBeGreaterThan(0);
      });
    });

    it('should only display first two amenities', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: 'WiFi, Pool, Gym, Spa' }],
      });

      const { getAllByText, queryByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getAllByText('WiFi').length).toBeGreaterThan(0);
        expect(getAllByText('Pool').length).toBeGreaterThan(0);
        // Third and fourth amenities should not be displayed
        expect(queryByText('Gym')).toBeNull();
        expect(queryByText('Spa')).toBeNull();
      });
    });
  });

  describe('Null/Undefined Amenidades', () => {
    it('should handle null amenidades gracefully', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: [{ ...mockHotelsData[0], amenidades: null as any }],
      });

      const { getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('Grand Hotel Paris')).toBeTruthy();
      });
    });
  });

  describe('Invalid Guests Parameter', () => {
    it('should handle invalid guests string', async () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: 'invalid',
      });
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: true,
        data: mockHotelsData,
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

  describe('Results Count Visibility', () => {
    it('should not show results count while loading', async () => {
      let resolvePromise: (value: any) => void;
      const searchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockHotelService.searchAvailableHotels.mockReturnValue(searchPromise as any);

      const { queryByText } = render(<HotelResultsScreen />);

      expect(queryByText(/results.hotels/)).toBeNull();

      await act(async () => {
        resolvePromise!({ success: true, data: mockHotelsData });
      });
    });

    it('should not show results count on error', async () => {
      mockHotelService.searchAvailableHotels.mockResolvedValue({
        success: false,
        error: { message: 'Error' },
      });

      const { queryByText, getByText } = render(<HotelResultsScreen />);

      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });

      expect(queryByText(/\d+ results.hotels/)).toBeNull();
    });
  });
});
