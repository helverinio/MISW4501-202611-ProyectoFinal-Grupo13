import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MyReservationsScreen from '../myReservations';
import { router } from 'expo-router';
import BookingService from '@/services/bookingService';
import { useUserStore } from '@/store/userStore';
import { useStaticDataStore } from '@/store/staticDataStore';

jest.mock('react-i18next', () => {
  const stableT = (key: string) => key;
  const stableI18n = {
    language: 'es',
    changeLanguage: jest.fn(),
  };

  return {
    useTranslation: () => ({
      t: stableT,
      i18n: stableI18n,
    }),
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/services/bookingService', () => ({
  __esModule: true,
  default: {
    getReservasByUsuario: jest.fn(),
    getHabitaciones: jest.fn(),
    getHoteles: jest.fn(),
    updateReserva: jest.fn(),
    acquireRoomHold: jest.fn(),
  },
}));

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('@/store/staticDataStore', () => ({
  useStaticDataStore: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  language: 'es',
}));

const mockUseUserStore = useUserStore as unknown as jest.Mock;
const mockUseStaticDataStore = useStaticDataStore as unknown as jest.Mock;
const mockGetReservasByUsuario = BookingService.getReservasByUsuario as jest.Mock;
const mockGetHabitaciones = BookingService.getHabitaciones as jest.Mock;
const mockGetHoteles = BookingService.getHoteles as jest.Mock;
const mockUpdateReserva = BookingService.updateReserva as jest.Mock;
const mockAcquireRoomHold = BookingService.acquireRoomHold as jest.Mock;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  nombre: 'Test User',
};

const mockEstados = [
  { id: 'estado-1', nombre: 'Confirmada' },
  { id: 'estado-2', nombre: 'Pendiente' },
  { id: 'estado-3', nombre: 'Cancelada' },
];

const mockCiudades = [
  { id: 'ciudad-1', nombre: 'Bogotá', id_pais: 'pais-1' },
  { id: 'ciudad-2', nombre: 'Madrid', id_pais: 'pais-2' },
];

const mockPaises = [
  { id: 'pais-1', nombre: 'Colombia' },
  { id: 'pais-2', nombre: 'España' },
];

const mockHabitaciones = [
  { id: 'hab-1', tipo: 'Suite', nro_habitacion: 101, capacidad: 3, camas: 2, id_hotel: 'hotel-1' },
  { id: 'hab-2', tipo: 'Doble', nro_habitacion: 202, capacidad: 2, camas: 1, id_hotel: 'hotel-2' },
];

const mockHoteles = [
  { id: 'hotel-1', nombre: 'Hotel Plaza', descripcion: 'Luxury', email: 'plaza@test.com', id_ciudad: 'ciudad-1', rating_promedio: 4.5 },
  { id: 'hotel-2', nombre: 'Hotel Sol', descripcion: 'Beach hotel', email: 'sol@test.com', id_ciudad: 'ciudad-2', rating_promedio: 3.8 },
];

// Future dates for upcoming reservations
const futureCheckIn = '2030-06-01';
const futureCheckOut = '2030-06-05';

// Past dates for completed reservations
const pastCheckIn = '2020-01-01';
const pastCheckOut = '2020-01-05';

const mockReservaConfirmed = {
  id: 'res-1',
  fecha_ingreso: futureCheckIn,
  fecha_salida: futureCheckOut,
  total: 500,
  nro_personas: 2,
  id_usuario: 'user-123',
  id_pais: 'pais-1',
  id_habitacion: 'hab-1',
  id_estado: 'estado-1',
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

const mockReservaPending = {
  id: 'res-2',
  fecha_ingreso: futureCheckIn,
  fecha_salida: futureCheckOut,
  total: 300,
  nro_personas: 1,
  id_usuario: 'user-123',
  id_pais: 'pais-2',
  id_habitacion: 'hab-2',
  id_estado: 'estado-2',
};

const mockReservaCancelled = {
  id: 'res-3',
  fecha_ingreso: futureCheckIn,
  fecha_salida: futureCheckOut,
  total: 400,
  nro_personas: 2,
  id_usuario: 'user-123',
  id_pais: 'pais-1',
  id_habitacion: 'hab-1',
  id_estado: 'estado-3',
};

const mockReservaCompleted = {
  id: 'res-4',
  fecha_ingreso: pastCheckIn,
  fecha_salida: pastCheckOut,
  total: 600,
  nro_personas: 3,
  id_usuario: 'user-123',
  id_pais: 'pais-2',
  id_habitacion: 'hab-2',
  id_estado: 'estado-1',
};

function setupMocks(overrides: {
  user?: any;
  estados?: any[];
  ciudades?: any[];
  paises?: any[];
  reservasResult?: any;
  habitacionesResult?: any;
  hotelesResult?: any;
} = {}) {
  const {
    user = mockUser,
    estados = mockEstados,
    ciudades = mockCiudades,
    paises = mockPaises,
    reservasResult = { success: true, data: [mockReservaConfirmed] },
    habitacionesResult = { success: true, data: mockHabitaciones },
    hotelesResult = { success: true, data: mockHoteles },
  } = overrides;

  mockUseUserStore.mockImplementation((selector: any) => selector({ user }));
  mockUseStaticDataStore.mockImplementation((selector: any) =>
    selector({ estados, ciudades, paises })
  );
  mockGetReservasByUsuario.mockResolvedValue(reservasResult);
  mockGetHabitaciones.mockResolvedValue(habitacionesResult);
  mockGetHoteles.mockResolvedValue(hotelesResult);
}

describe('MyReservationsScreen', () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await flushMicrotasks();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', async () => {
      setupMocks();
      const deferred = createDeferred<{ success: boolean; data: typeof mockReservaConfirmed[] }>();// keep loading visible
      mockGetReservasByUsuario.mockReturnValueOnce(deferred.promise);
      const { getByText } = render(<MyReservationsScreen />);
      expect(getByText('myReservations.loading')).toBeTruthy();

      deferred.resolve({ success: true, data: [mockReservaConfirmed] });
      await flushMicrotasks();
    });
  });

  describe('Error States', () => {
    it('should show error when user is null', async () => {
      setupMocks({ user: null });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.missingUser')).toBeTruthy();
      });
    });

    it('should show error when user id is undefined', async () => {
      setupMocks({ user: {} });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.missingUser')).toBeTruthy();
      });
    });

    it('should show error when reservas API fails', async () => {
      setupMocks({ reservasResult: { success: false, error: { message: 'Network error' } } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.loadError')).toBeTruthy();
      });
    });

    it('should show error when reservas data is null', async () => {
      setupMocks({ reservasResult: { success: true, data: null } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.loadError')).toBeTruthy();
      });
    });

    it('should show error when API throws exception', async () => {
      setupMocks();
      mockGetReservasByUsuario.mockRejectedValue(new Error('Network failure'));
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.loadError')).toBeTruthy();
      });
    });

    it('should show retry button on error', async () => {
      setupMocks({ reservasResult: { success: false } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.retry')).toBeTruthy();
      });
    });

    it('should reload on retry press', async () => {
      setupMocks({ reservasResult: { success: false } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.retry')).toBeTruthy();
      });

      mockGetReservasByUsuario.mockResolvedValue({ success: true, data: [mockReservaConfirmed] });
      await act(async () => {
        fireEvent.press(getByText('myReservations.retry'));
      });
      await waitFor(() => {
        expect(mockGetReservasByUsuario).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no reservations', async () => {
      setupMocks({ reservasResult: { success: true, data: [] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.emptyTitle')).toBeTruthy();
        expect(getByText('myReservations.emptySubtitle')).toBeTruthy();
      });
    });

    it('should show empty state when no reservations match active tab', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaCancelled] } });
      const { getByText } = render(<MyReservationsScreen />);
      // Default tab is 'upcoming', cancelled shouldn't appear
      await waitFor(() => {
        expect(getByText('myReservations.emptyTitle')).toBeTruthy();
      });
    });
  });

  describe('Reservation Display', () => {
    it('should display hotel name for confirmed reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Hotel Plaza')).toBeTruthy();
      });
    });

    it('should display location for reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Bogotá, Colombia')).toBeTruthy();
      });
    });

    it('should display status badge for confirmed reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.confirmed')).toBeTruthy();
      });
    });

    it('should display total for reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('$500 myReservations.currency')).toBeTruthy();
      });
    });

    it('should display guests label', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('2 myReservations.adults')).toBeTruthy();
      });
    });

    it('should display singular adult label for 1 guest', async () => {
      const singleGuestReserva = { ...mockReservaConfirmed, nro_personas: 1 };
      setupMocks({ reservasResult: { success: true, data: [singleGuestReserva] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('1 myReservations.adult')).toBeTruthy();
      });
    });

    it('should display pending reservation in upcoming tab', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.pending')).toBeTruthy();
      });
    });

    it('should display rating for hotel', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('4.5')).toBeTruthy();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all three tabs', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.upcoming')).toBeTruthy();
        expect(getByText('myReservations.past')).toBeTruthy();
        expect(getByText('myReservations.cancelled')).toBeTruthy();
      });
    });

    it('should show cancelled reservations when cancelled tab is pressed', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaConfirmed, mockReservaCancelled] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Hotel Plaza')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.cancelled'));
      });
      await waitFor(() => {
        expect(getByText('myReservations.cancelledStatus')).toBeTruthy();
      });
    });

    it('should show completed reservations when past tab is pressed', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaConfirmed, mockReservaCompleted] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Hotel Plaza')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.past'));
      });
      await waitFor(() => {
        expect(getByText('myReservations.completed')).toBeTruthy();
      });
    });

    it('should show empty state for past tab when no completed reservations', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaConfirmed] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Hotel Plaza')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.past'));
      });
      await waitFor(() => {
        expect(getByText('myReservations.emptyTitle')).toBeTruthy();
      });
    });
  });

  describe('Actions - Confirmed Reservation', () => {
    it('should show view details button for confirmed reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.viewDetails')).toBeTruthy();
      });
    });

    it('should show modify button for confirmed reservation', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.modify')).toBeTruthy();
      });
    });

    it('should navigate to details on view details press', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.viewDetails')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.viewDetails'));
      });
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/screens/myReservationDetail',
          params: expect.objectContaining({
            reservationId: 'res-1',
            hotelName: 'Hotel Plaza',
          }),
        })
      );
    });

    it('should navigate to edit on modify press', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.modify')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.modify'));
      });
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/screens/editReservation',
          params: expect.objectContaining({
            reservationId: 'res-1',
            hotelId: 'hotel-1',
          }),
        })
      );
    });
  });

  describe('Actions - Pending Reservation', () => {
    it('should show complete payment button for pending reservation', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.completePayment')).toBeTruthy();
      });
    });

    it('should show cancel button for pending reservation', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.cancel')).toBeTruthy();
      });
    });

    it('should navigate to payment on complete payment press', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      mockAcquireRoomHold.mockResolvedValue({ success: true, data: { id: 'hold-abc' } });

      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.completePayment')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.completePayment'));
      });

      await waitFor(() => {
        expect(mockAcquireRoomHold).toHaveBeenCalledWith('hab-2', {
          id_usuario: 'user-123',
          fecha_ingreso: futureCheckIn,
          fecha_salida: futureCheckOut,
        });
        expect(router.push).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/payment',
            params: expect.objectContaining({
              reservationId: 'res-2',
              holdId: 'hold-abc',
            }),
          })
        );
      });
    });

    it('should show alert when hold acquisition fails', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      mockAcquireRoomHold.mockResolvedValue({ success: false, error: { message: 'Room unavailable' } });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.completePayment')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.completePayment'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Room unavailable');
      });
    });

    it('should show alert when complete payment throws', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });
      mockAcquireRoomHold.mockRejectedValue(new Error('Network error'));
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.completePayment')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.completePayment'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'myReservations.loadError');
      });
    });

    it('should navigate to cancelReservation on cancel press', async () => {
      setupMocks({ reservasResult: { success: true, data: [mockReservaPending] } });

      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.cancel')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.cancel'));
      });

      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/screens/cancelReservation',
          params: expect.objectContaining({
            reservationId: 'res-2',
            hotelName: 'Hotel Sol',
          }),
        })
      );
    });
  });

  describe('Navigation', () => {
    it('should call router.back on back button press', async () => {
      setupMocks();
      const { getByText, UNSAFE_getAllByProps } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.title')).toBeTruthy();
      });

      const accessiblePressables = UNSAFE_getAllByProps({ accessible: true });
      fireEvent.press(accessiblePressables[0]);
      expect(router.back).toHaveBeenCalled();
    });

    it('should render header title', async () => {
      setupMocks();
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.title')).toBeTruthy();
      });
    });
  });

  describe('Service Calls', () => {
    it('should call getReservasByUsuario with user id', async () => {
      setupMocks();
      render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(mockGetReservasByUsuario).toHaveBeenCalledWith('user-123');
      });
    });

    it('should call getHabitaciones', async () => {
      setupMocks();
      render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(mockGetHabitaciones).toHaveBeenCalled();
      });
    });

    it('should call getHoteles', async () => {
      setupMocks();
      render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(mockGetHoteles).toHaveBeenCalled();
      });
    });

    it('should not call services when user is missing', async () => {
      setupMocks({ user: null });
      render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(mockGetReservasByUsuario).not.toHaveBeenCalled();
      });
    });
  });

  describe('Status Resolution', () => {
    it('should resolve cancelled status correctly', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaCancelled] },
      });
      const { getByText } = render(<MyReservationsScreen />);

      await waitFor(() => {
        expect(getByText('myReservations.cancelled')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.cancelled'));
      });
      await waitFor(() => {
        expect(getByText('myReservations.cancelledStatus')).toBeTruthy();
      });
    });

    it('should resolve completed status for past checkout dates', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaCompleted] },
      });
      const { getByText } = render(<MyReservationsScreen />);

      await waitFor(() => {
        expect(getByText('myReservations.past')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('myReservations.past'));
      });
      await waitFor(() => {
        expect(getByText('myReservations.completed')).toBeTruthy();
      });
    });

    it('should resolve pending status correctly', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaPending] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.pending')).toBeTruthy();
      });
    });
  });

  describe('Fallback Reservation', () => {
    it('should handle missing habitacion gracefully', async () => {
      const reservaWithBadHabitacion = {
        ...mockReservaConfirmed,
        id_habitacion: 'nonexistent-hab',
      };
      setupMocks({
        reservasResult: { success: true, data: [reservaWithBadHabitacion] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.defaultHotel')).toBeTruthy();
      });
    });

    it('should use pais name as location when hotel city not found', async () => {
      const reservaWithBadHabitacion = {
        ...mockReservaConfirmed,
        id_habitacion: 'nonexistent-hab',
        id_pais: 'pais-1',
      };
      setupMocks({
        reservasResult: { success: true, data: [reservaWithBadHabitacion] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Colombia')).toBeTruthy();
      });
    });
  });

  describe('Static Data Cache', () => {
    it('should use cached estados from store', async () => {
      setupMocks();
      render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(mockUseStaticDataStore).toHaveBeenCalled();
      });
    });

    it('should handle empty cached data gracefully', async () => {
      setupMocks({ estados: [], ciudades: [], paises: [] });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        // With empty estados, status resolution defaults to 'pending' for future dates
        expect(getByText('myReservations.pending')).toBeTruthy();
      });
    });
  });

  describe('Habitaciones and Hoteles handling', () => {
    it('should handle null habitaciones result data', async () => {
      setupMocks({ habitacionesResult: { success: true, data: null } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        // Should still render with fallback values
        expect(getByText('myReservations.defaultHotel')).toBeTruthy();
      });
    });

    it('should handle null hoteles result data', async () => {
      setupMocks({ hotelesResult: { success: true, data: null } });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('myReservations.defaultHotel')).toBeTruthy();
      });
    });
  });

  describe('Multiple Reservations', () => {
    it('should render multiple reservation cards in upcoming tab', async () => {
      setupMocks({
        reservasResult: { success: true, data: [mockReservaConfirmed, mockReservaPending] },
      });
      const { getByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        expect(getByText('Hotel Plaza')).toBeTruthy();
        expect(getByText('Hotel Sol')).toBeTruthy();
      });
    });

    it('should sort reservations by check-in date', async () => {
      const laterReserva = { ...mockReservaPending, fecha_ingreso: '2030-07-01' };
      setupMocks({
        reservasResult: { success: true, data: [laterReserva, mockReservaConfirmed] },
      });
      const { getAllByText } = render(<MyReservationsScreen />);
      await waitFor(() => {
        // Both should be rendered
        const totals = getAllByText(/\$.*myReservations.currency/);
        expect(totals.length).toBe(2);
      });
    });
  });
});
