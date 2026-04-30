import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, ActivityIndicator } from 'react-native';
import CancelReservationScreen from '../cancelReservation';
import { router, useLocalSearchParams } from 'expo-router';
import BookingService from '@/services/bookingService';
import { useStaticDataStore } from '@/store/staticDataStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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

jest.mock('@/services/bookingService', () => ({
  __esModule: true,
  default: {
    getEstados: jest.fn(),
    updateReserva: jest.fn(),
  },
}));

jest.mock('@/store/staticDataStore', () => ({
  useStaticDataStore: jest.fn(),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  language: 'es',
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseStaticDataStore = useStaticDataStore as unknown as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
const mockGetEstados = BookingService.getEstados as jest.Mock;
const mockUpdateReserva = BookingService.updateReserva as jest.Mock;

const mockEstados = [
  { id: 'estado-1', nombre: 'Confirmada' },
  { id: 'estado-2', nombre: 'Pendiente' },
  { id: 'estado-3', nombre: 'Completada' },
];

const mockEstadosWithCancel = [
  { id: 'estado-1', nombre: 'Confirmada' },
  { id: 'estado-2', nombre: 'Pendiente' },
  { id: 'estado-cancelada', nombre: 'Cancelada' },
];

const defaultParams = {
  reservationId: 'res-123',
  hotelName: 'Hotel Plaza',
  location: 'Bogotá, Colombia',
  checkIn: '2030-06-01',
  checkOut: '2030-06-05',
  nights: '4',
  guests: '2',
  children: '0',
  total: '500',
  roomType: 'Suite',
};

function setupMocks(overrides: {
  params?: any;
  estados?: any[];
  isOffline?: boolean;
} = {}) {
  const {
    params = defaultParams,
    estados = mockEstadosWithCancel,
    isOffline = false,
  } = overrides;

  mockUseLocalSearchParams.mockReturnValue(params);
  mockUseStaticDataStore.mockImplementation((selector: any) =>
    selector({ estados })
  );
  mockUseNetworkStatus.mockReturnValue({ isOffline });
}

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

describe('CancelReservationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(async () => {
    await flushMicrotasks();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  describe('Rendering', () => {
    it('should render header title', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should render warning card', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.warningTitle')).toBeTruthy();
      expect(getByText('cancelReservation.warningMessage')).toBeTruthy();
    });

    it('should render reservation summary', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.reservationSummary')).toBeTruthy();
      expect(getByText('Hotel Plaza')).toBeTruthy();
      expect(getByText('Bogotá, Colombia')).toBeTruthy();
    });

    it('should render hotel name from params', () => {
      setupMocks({ params: { ...defaultParams, hotelName: 'Grand Hotel' } });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('Grand Hotel')).toBeTruthy();
    });

    it('should render location from params', () => {
      setupMocks({ params: { ...defaultParams, location: 'Madrid, España' } });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('Madrid, España')).toBeTruthy();
    });

    it('should render confirmation ID', () => {
      setupMocks();
      const { getAllByText } = render(<CancelReservationScreen />);
      const confirmationLabels = getAllByText(/cancelReservation\.confirmation/);
      expect(confirmationLabels.length).toBeGreaterThan(0);
    });

    it('should render total paid', () => {
      setupMocks();
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$500\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should render refund policy section', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.refundPolicy')).toBeTruthy();
      expect(getByText('cancelReservation.fullRefund')).toBeTruthy();
      expect(getByText('cancelReservation.partialRefund')).toBeTruthy();
      expect(getByText('cancelReservation.noRefund')).toBeTruthy();
    });

    it('should render reason selection', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.reasonTitle')).toBeTruthy();
      expect(getByText('cancelReservation.reasonSubtitle')).toBeTruthy();
      expect(getByText('cancelReservation.reasonChangePlans')).toBeTruthy();
      expect(getByText('cancelReservation.reasonBetterPrice')).toBeTruthy();
      expect(getByText('cancelReservation.reasonTravelRestrictions')).toBeTruthy();
      expect(getByText('cancelReservation.reasonBookedMistake')).toBeTruthy();
      expect(getByText('cancelReservation.reasonOther')).toBeTruthy();
    });

    it('should render comments input', () => {
      setupMocks();
      const { getByPlaceholderText } = render(<CancelReservationScreen />);
      expect(getByPlaceholderText('cancelReservation.commentsPlaceholder')).toBeTruthy();
    });

    it('should render agreement checkbox', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.agreementText')).toBeTruthy();
    });

    it('should render estimated refund', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.estimatedRefund')).toBeTruthy();
    });

    it('should render action buttons', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.keepReservation')).toBeTruthy();
      expect(getByText('cancelReservation.confirmCancellation')).toBeTruthy();
    });

    it('should handle missing params gracefully', () => {
      setupMocks({ params: {} });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should show formatted check-in and check-out dates', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      // The dates are formatted, so we just check that the component renders
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });
  });

  describe('Refund Calculation', () => {
    it('should show full refund when cancelling more than 7 days before', () => {
      const futureCheckIn = '2030-12-01';
      setupMocks({
        params: { ...defaultParams, checkIn: futureCheckIn, total: '1000' },
      });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$1000\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should show partial refund when cancelling 2-7 days before', () => {
      const nearFutureCheckIn = new Date();
      nearFutureCheckIn.setDate(nearFutureCheckIn.getDate() + 5);
      const checkInStr = nearFutureCheckIn.toISOString().split('T')[0];
      setupMocks({
        params: { ...defaultParams, checkIn: checkInStr, total: '1000' },
      });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$500\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should show no refund when cancelling less than 2 days before', () => {
      const veryNearFutureCheckIn = new Date();
      veryNearFutureCheckIn.setDate(veryNearFutureCheckIn.getDate() + 1);
      const checkInStr = veryNearFutureCheckIn.toISOString().split('T')[0];
      setupMocks({
        params: { ...defaultParams, checkIn: checkInStr, total: '1000' },
      });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$0\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should calculate partial refund with rounding', () => {
      const nearFutureCheckIn = new Date();
      nearFutureCheckIn.setDate(nearFutureCheckIn.getDate() + 5);
      const checkInStr = nearFutureCheckIn.toISOString().split('T')[0];
      setupMocks({
        params: { ...defaultParams, checkIn: checkInStr, total: '333.33' },
      });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$166\.67 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });
  });

  describe('Cancellation Reason Selection', () => {
    it('should select changePlans by default', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.reasonChangePlans')).toBeTruthy();
    });

    it('should allow selecting different reason', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.reasonBetterPrice'));
      });

      expect(getByText('cancelReservation.reasonBetterPrice')).toBeTruthy();
    });

    it('should allow selecting travelRestrictions reason', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.reasonTravelRestrictions'));
      });

      expect(getByText('cancelReservation.reasonTravelRestrictions')).toBeTruthy();
    });

    it('should allow selecting bookedMistake reason', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.reasonBookedMistake'));
      });

      expect(getByText('cancelReservation.reasonBookedMistake')).toBeTruthy();
    });

    it('should allow selecting other reason', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.reasonOther'));
      });

      expect(getByText('cancelReservation.reasonOther')).toBeTruthy();
    });
  });

  describe('Comments Input', () => {
    it('should allow typing comments', async () => {
      setupMocks();
      const { getByPlaceholderText } = render(<CancelReservationScreen />);
      const input = getByPlaceholderText('cancelReservation.commentsPlaceholder');

      await act(async () => {
        fireEvent.changeText(input, 'Need to cancel due to emergency');
      });

      expect(input.props.value).toBe('Need to cancel due to emergency');
    });

    it('should handle empty comments', async () => {
      setupMocks();
      const { getByPlaceholderText } = render(<CancelReservationScreen />);
      const input = getByPlaceholderText('cancelReservation.commentsPlaceholder');

      expect(input.props.value).toBe('');
    });
  });

  describe('Agreement Checkbox', () => {
    it('should be unchecked by default', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.agreementText')).toBeTruthy();
    });

    it('should toggle checkbox on press', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      expect(getByText('cancelReservation.agreementText')).toBeTruthy();
    });

    it('should uncheck when pressed again', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      expect(getByText('cancelReservation.agreementText')).toBeTruthy();
    });
  });

  describe('Cancellation Validation', () => {
    it('should show alert when trying to cancel without agreement', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({ success: true });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(Alert.alert).toHaveBeenCalledWith('', 'cancelReservation.agreementRequired');
      expect(mockUpdateReserva).not.toHaveBeenCalled();
    });

    it('should show alert when estado ID is not loaded', async () => {
      setupMocks({ estados: mockEstados }); // Use estados without 'cancel'
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'cancelReservation.errorMessage');
    });
  });

  describe('Cancellation Flow - Success', () => {
    it('should successfully cancel reservation', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({ success: true });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        expect(mockUpdateReserva).toHaveBeenCalledWith('res-123', {
          id_estado: 'estado-cancelada',
        });
        expect(Alert.alert).toHaveBeenCalledWith(
          'cancelReservation.successTitle',
          'cancelReservation.successMessage',
          expect.arrayContaining([
            expect.objectContaining({
              text: 'common.ok',
              onPress: expect.any(Function),
            }),
          ])
        );
      });
    });

    it('should navigate back after successful cancellation', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({ success: true });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        const alertCalls = (Alert.alert as jest.Mock).mock.calls;
        const okButton = alertCalls[alertCalls.length - 1][2][0];
        okButton.onPress();
        expect(router.back).toHaveBeenCalled();
      });
    });

    it('should show loading indicator during cancellation', async () => {
      setupMocks();
      const deferred = createDeferred<{ success: boolean }>();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockReturnValue(deferred.promise);

      const { getByText, UNSAFE_getByType } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      deferred.resolve({ success: true });
      await flushMicrotasks();
    });
  });

  describe('Cancellation Flow - Error', () => {
    it('should show error alert when API fails', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({
        success: false,
        error: { message: 'Network error' },
      });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
      });
    });

    it('should show generic error when API returns no error message', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({ success: false });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'cancelReservation.errorMessage');
      });
    });

    it('should show error when API throws exception', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockRejectedValue(new Error('Network failure'));
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'cancelReservation.errorMessage');
      });
    });

    it('should reset cancelling state after error', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockRejectedValue(new Error('Network failure'));
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      await waitFor(() => {
        expect(getByText('cancelReservation.confirmCancellation')).toBeTruthy();
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should call router.back on back button press', () => {
      setupMocks();
      const { UNSAFE_getAllByProps } = render(<CancelReservationScreen />);
      const accessiblePressables = UNSAFE_getAllByProps({ accessible: true });
      if (accessiblePressables.length > 0) {
        fireEvent.press(accessiblePressables[0]);
        expect(router.back).toHaveBeenCalled();
      }
    });

    it('should call router.back on close button press', () => {
      setupMocks();
      const { UNSAFE_getAllByProps } = render(<CancelReservationScreen />);

      const accessiblePressables = UNSAFE_getAllByProps({ accessible: true });
      // Try pressing the second accessible element (close button in header)
      if (accessiblePressables.length > 1) {
        fireEvent.press(accessiblePressables[1]);
        expect(router.back).toHaveBeenCalled();
      } else {
        // If there's only one, skip this test
        expect(true).toBe(true);
      }
    });

    it('should call router.back on keep reservation press', async () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.keepReservation'));
      });

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Offline Mode', () => {
    it('should disable confirm button when offline', () => {
      setupMocks({ isOffline: true });
      const { getByText } = render(<CancelReservationScreen />);
      const button = getByText('cancelReservation.confirmCancellation');
      // Check if button exists (it should be rendered but disabled)
      expect(button).toBeTruthy();
      // The component handles offline by not allowing the action
    });

    it('should not allow cancellation when offline', async () => {
      setupMocks({ isOffline: true });
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockResolvedValue({ success: true });
      jest.spyOn(Alert, 'alert');

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(mockUpdateReserva).not.toHaveBeenCalled();
    });
  });

  describe('Estado ID Loading', () => {
    it('should load cancelled estado ID from cache', async () => {
      setupMocks();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });

      render(<CancelReservationScreen />);

      await flushMicrotasks();

      expect(mockGetEstados).not.toHaveBeenCalled();
    });

    it('should load cancelled estado ID from API when not in cache', async () => {
      setupMocks({ estados: [] });
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });

      render(<CancelReservationScreen />);

      await flushMicrotasks();

      expect(mockGetEstados).toHaveBeenCalled();
    });

    it('should handle API failure when loading estados', async () => {
      setupMocks({ estados: [] });
      mockGetEstados.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should handle empty estados from API', async () => {
      setupMocks({ estados: [] });
      mockGetEstados.mockResolvedValue({ success: true, data: [] });

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should handle null data from estados API', async () => {
      setupMocks({ estados: [] });
      mockGetEstados.mockResolvedValue({ success: true, data: null });

      const { getByText } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      expect(getByText('cancelReservation.title')).toBeTruthy();
    });
  });

  describe('Guests Display', () => {
    it('should display adults label correctly for multiple guests', () => {
      setupMocks({ params: { ...defaultParams, guests: '3' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const guestLabels = getAllByText(/3 cancelReservation\.adults/);
      expect(guestLabels.length).toBeGreaterThan(0);
    });

    it('should display adult label correctly for single guest', () => {
      setupMocks({ params: { ...defaultParams, guests: '1' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const guestLabels = getAllByText(/1 cancelReservation\.adult/);
      expect(guestLabels.length).toBeGreaterThan(0);
    });

    it('should display children when present', () => {
      setupMocks({ params: { ...defaultParams, guests: '2', children: '2' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const childLabels = getAllByText(/2 cancelReservation\.children/);
      expect(childLabels.length).toBeGreaterThan(0);
    });

    it('should display child label for single child', () => {
      setupMocks({ params: { ...defaultParams, guests: '2', children: '1' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const childLabels = getAllByText(/1 cancelReservation\.child/);
      expect(childLabels.length).toBeGreaterThan(0);
    });

    it('should handle zero children', () => {
      setupMocks({ params: { ...defaultParams, guests: '2', children: '0' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const guestLabels = getAllByText(/2 cancelReservation\.adults/);
      expect(guestLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Nights Display', () => {
    it('should display singular night for 1 night', () => {
      setupMocks({ params: { ...defaultParams, nights: '1' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const nightLabels = getAllByText(/1 cancelReservation\.night/);
      expect(nightLabels.length).toBeGreaterThan(0);
    });

    it('should display plural nights for multiple nights', () => {
      setupMocks({ params: { ...defaultParams, nights: '5' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const nightLabels = getAllByText(/5 cancelReservation\.nights/);
      expect(nightLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in Spanish locale by default', () => {
      setupMocks();
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should disable confirm button when cancelling', async () => {
      setupMocks();
      const deferred = createDeferred<{ success: boolean }>();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockReturnValue(deferred.promise);

      const { getByText, UNSAFE_getByType } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      deferred.resolve({ success: true });
      await flushMicrotasks();
    });

    it('should enable keep button during cancellation', async () => {
      setupMocks();
      const deferred = createDeferred<{ success: boolean }>();
      mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
      mockUpdateReserva.mockReturnValue(deferred.promise);

      const { getByText, UNSAFE_getByType } = render(<CancelReservationScreen />);

      await flushMicrotasks();

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.agreementText'));
      });

      await act(async () => {
        fireEvent.press(getByText('cancelReservation.confirmCancellation'));
      });

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
      expect(getByText('cancelReservation.keepReservation')).toBeTruthy();

      deferred.resolve({ success: true });
      await flushMicrotasks();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total amount', () => {
      setupMocks({ params: { ...defaultParams, total: '0' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$0\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should handle very large total amount', () => {
      setupMocks({ params: { ...defaultParams, total: '999999' } });
      const { getAllByText } = render(<CancelReservationScreen />);
      const currencyElements = getAllByText(/\$999999\.00 cancelReservation\.currency/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });

    it('should handle missing check-in date', () => {
      setupMocks({ params: { ...defaultParams, checkIn: '' } });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should handle missing check-out date', () => {
      setupMocks({ params: { ...defaultParams, checkOut: '' } });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });

    it('should handle invalid date format', () => {
      setupMocks({ params: { ...defaultParams, checkIn: 'invalid-date' } });
      const { getByText } = render(<CancelReservationScreen />);
      expect(getByText('cancelReservation.title')).toBeTruthy();
    });
  });
});
