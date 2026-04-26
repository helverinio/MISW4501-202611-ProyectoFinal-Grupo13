import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditReservationScreen from '../editReservation';
import { router, useLocalSearchParams } from 'expo-router';
import { HotelService } from '@/services/hotelService';
import { BookingService } from '@/services/bookingService';
import { useUserStore } from '@/store/userStore';

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
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/services/hotelService', () => ({
  HotelService: {
    searchAvailableHotels: jest.fn(),
  },
}));

jest.mock('@/services/bookingService', () => ({
  BookingService: {
    acquireRoomHold: jest.fn(),
    getEstados: jest.fn(),
    updateReserva: jest.fn(),
  },
}));

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    language: 'es',
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseUserStore = useUserStore as unknown as jest.Mock;
const mockSearchAvailableHotels = HotelService.searchAvailableHotels as jest.Mock;
const mockAcquireRoomHold = BookingService.acquireRoomHold as jest.Mock;
const mockGetEstados = BookingService.getEstados as jest.Mock;
const mockUpdateReserva = BookingService.updateReserva as jest.Mock;

const baseParams = {
  reservationId: 'res-1',
  hotelId: 'hotel-1',
  hotelName: 'Hotel Plaza',
  habitacionId: 'room-1',
  roomType: 'Suite',
  roomCapacity: '2',
  roomBeds: '1',
  location: 'Bogota',
  pais: 'Colombia',
  checkIn: '2030-06-10',
  checkOut: '2030-06-12',
  guests: '2',
  nights: '2',
  total: '500',
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const hotelSearchSuccess = {
  success: true,
  data: [
    {
      hotel_id: 'hotel-1',
      nombre: 'Hotel Plaza',
      habitaciones: [
        {
          habitacion_id: 'room-1',
          tipo: 'Suite',
          capacidad: 2,
          camas: 1,
          precio_promedio_noche: 180,
        },
        {
          habitacion_id: 'room-2',
          tipo: 'Estandar',
          capacidad: 2,
          camas: 1,
          precio_promedio_noche: 100,
        },
      ],
    },
  ],
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

function setup(overrides: {
  params?: Partial<typeof baseParams>;
  hotelResult?: any;
} = {}) {
  const { params = {}, hotelResult = hotelSearchSuccess } = overrides;

  mockUseLocalSearchParams.mockReturnValue({
    ...baseParams,
    ...params,
  });

  mockUseUserStore.mockImplementation((selector: any) =>
    selector({ user: mockUser })
  );

  mockSearchAvailableHotels.mockResolvedValue(hotelResult);
  mockAcquireRoomHold.mockResolvedValue({ success: true, data: { id: 'hold-123' } });
  mockGetEstados.mockResolvedValue({ success: true, data: [{ id: 'estado-2', nombre: 'Pendiente' }] });
  mockUpdateReserva.mockResolvedValue({ success: true, data: {} });
}

describe('EditReservationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    setup();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading state while reservation data is being fetched', async () => {
    const deferred = createDeferred<typeof hotelSearchSuccess>();
    mockSearchAvailableHotels.mockReturnValueOnce(deferred.promise);

    const { getByText } = render(<EditReservationScreen />);
    expect(getByText('editReservation.loading')).toBeTruthy();

    deferred.resolve(hotelSearchSuccess);

    await waitFor(() => {
      expect(getByText('editReservation.title')).toBeTruthy();
    });
  });

  it('renders reservation details and available rooms after load', async () => {
    const { getByText, getAllByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('Hotel Plaza')).toBeTruthy();
      expect(getByText('editReservation.currentReservation')).toBeTruthy();
      expect(getAllByText('Suite').length).toBeGreaterThan(0);
      expect(getByText('Estandar')).toBeTruthy();
      expect(getByText('editReservation.saveChanges')).toBeTruthy();
    });
  });

  it('uses fallback room option when hotel room search throws error', async () => {
    mockSearchAvailableHotels.mockRejectedValueOnce(new Error('API error'));

    const { getByText, getAllByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getAllByText('Suite').length).toBeGreaterThan(0);
      expect(getByText('$100editReservation.perNight')).toBeTruthy();
    });
  });

  it('calls router.back when pressing header back action', async () => {
    const { getByText, UNSAFE_getAllByProps } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('editReservation.title')).toBeTruthy();
    });

    const accessiblePressables = UNSAFE_getAllByProps({ accessible: true });

    await act(async () => {
      fireEvent.press(accessiblePressables[0]);
    });

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('calls router.back when pressing cancel button', async () => {
    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('editReservation.cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('editReservation.cancel'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('shows no changes alert when save is pressed without modifications', async () => {
    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('editReservation.saveChanges')).toBeTruthy();
    });

    fireEvent.press(getByText('editReservation.saveChanges'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('', 'editReservation.noChanges');
    });
  });

  it('shows error alert when reservation id is missing and user tries to save', async () => {
    setup({ params: { reservationId: undefined } });
    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('Estandar')).toBeTruthy();
    });

    fireEvent.press(getByText('Estandar'));
    fireEvent.press(getByText('editReservation.saveChanges'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'editReservation.errorSaving');
    });

    expect(mockUpdateReserva).not.toHaveBeenCalled();
  });

  it('updates reservation directly when price difference is zero or negative', async () => {
    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('Estandar')).toBeTruthy();
    });

    fireEvent.press(getByText('Estandar'));
    fireEvent.press(getByText('editReservation.saveChanges'));

    await waitFor(() => {
      expect(mockUpdateReserva).toHaveBeenCalledWith(
        'res-1',
        expect.objectContaining({
          id_habitacion: 'room-2',
          total: 230,
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'editReservation.successTitle',
        'editReservation.successMessage',
        expect.any(Array)
      );
    });

    const successAlertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call) => call[0] === 'editReservation.successTitle'
    );
    expect(successAlertCall).toBeTruthy();

    const buttons = successAlertCall?.[2] as Array<{ onPress?: () => void }>;
    buttons?.[0]?.onPress?.();
    expect(router.back).toHaveBeenCalled();
  });

  it('navigates to payment when price difference is positive', async () => {
    setup({
      params: { total: '200' },
      hotelResult: {
        success: true,
        data: [
          {
            hotel_id: 'hotel-1',
            nombre: 'Hotel Plaza',
            habitaciones: [
              {
                habitacion_id: 'room-1',
                tipo: 'Suite',
                capacidad: 2,
                camas: 1,
                precio_promedio_noche: 100,
              },
              {
                habitacion_id: 'room-2',
                tipo: 'Premium',
                capacidad: 3,
                camas: 2,
                precio_promedio_noche: 220,
              },
            ],
          },
        ],
      },
    });

    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('Premium')).toBeTruthy();
    });

    fireEvent.press(getByText('Premium'));
    fireEvent.press(getByText('editReservation.saveChanges'));

    await waitFor(() => {
      expect(mockAcquireRoomHold).toHaveBeenCalledWith('room-2', {
        id_usuario: 'user-123',
        fecha_ingreso: '2030-06-10',
        fecha_salida: '2030-06-12',
      });
      expect(mockGetEstados).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/screens/payment',
          params: expect.objectContaining({
            reservationId: 'res-1',
            holdId: 'hold-123',
            grandTotal: '306',
            isModification: 'true',
          }),
        })
      );
    });

    expect(mockUpdateReserva).not.toHaveBeenCalled();
  });

  it('shows alert and does not navigate when room hold cannot be acquired', async () => {
    setup({
      params: { total: '200' },
      hotelResult: {
        success: true,
        data: [
          {
            hotel_id: 'hotel-1',
            nombre: 'Hotel Plaza',
            habitaciones: [
              {
                habitacion_id: 'room-1',
                tipo: 'Suite',
                capacidad: 2,
                camas: 1,
                precio_promedio_noche: 100,
              },
              {
                habitacion_id: 'room-2',
                tipo: 'Premium',
                capacidad: 3,
                camas: 2,
                precio_promedio_noche: 220,
              },
            ],
          },
        ],
      },
    });

    mockAcquireRoomHold.mockResolvedValueOnce({
      success: false,
      error: { message: 'Room unavailable' },
    });

    const { getByText } = render(<EditReservationScreen />);

    await waitFor(() => {
      expect(getByText('Premium')).toBeTruthy();
    });

    fireEvent.press(getByText('Premium'));
    fireEvent.press(getByText('editReservation.saveChanges'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Room unavailable');
    });

    expect(router.push).not.toHaveBeenCalled();
  });
});
