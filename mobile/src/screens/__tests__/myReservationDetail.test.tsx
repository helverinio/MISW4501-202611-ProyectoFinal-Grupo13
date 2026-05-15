import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import MyReservationDetailScreen from '../myReservationDetail';
import { router, useLocalSearchParams } from 'expo-router';

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

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    language: 'es',
  },
}));

jest.mock('@/services/offlineCache', () => ({
  loadDetail: jest.fn().mockResolvedValue({ data: null }),
  saveDetail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const baseParams = {
  reservationId: 'res-abcd',
  hotelId: 'hotel-1',
  hotelName: 'Hotel Plaza',
  hotelEmail: 'plaza@test.com',
  roomType: 'Suite',
  roomCapacity: '4',
  roomBeds: '2',
  location: 'Bogota, Colombia',
  checkIn: '2030-06-01',
  checkInTime: '3:00 PM',
  checkOut: '2030-06-05',
  checkOutTime: '11:00 AM',
  guests: '2',
  nights: '2',
  total: '1000',
  status: 'confirmed',
  rating: '4.5',
};

function setupParams(overrides: Partial<typeof baseParams> = {}) {
  mockUseLocalSearchParams.mockReturnValue({
    ...baseParams,
    ...overrides,
  });
}

describe('MyReservationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    setupParams();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders reservation details with computed values', async () => {
    const currentYear = new Date().getFullYear();
    const { getByText } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText('reservationDetail.title')).toBeTruthy();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(getByText(`#TH-${currentYear}-ABCD`)).toBeTruthy();
      expect(getByText('Hotel Plaza')).toBeTruthy();
      expect(getByText('Suite')).toBeTruthy();
      expect(getByText('2 reservationDetail.beds • reservationDetail.capacity: 4 • 35m²')).toBeTruthy();
      expect(getByText('2 reservationDetail.adults')).toBeTruthy();
      expect(getByText('2 reservationDetail.nights × $435 USD')).toBeTruthy();
      expect(getByText('$869.57')).toBeTruthy();
      expect(getByText('$43.48')).toBeTruthy();
      expect(getByText('$86.96')).toBeTruthy();
      expect(getByText('$1000.00USD')).toBeTruthy();
      expect(getByText('4.5 (500)')).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('formats today date with reservationDetail.today label', async () => {
    const today = new Date().toISOString().slice(0, 10);
    setupParams({ checkIn: today });

    const { getByText } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText(/reservationDetail\.today/)).toBeTruthy();
    });
  });

  it('calls router.back when pressing header back action', async () => {
    const { getByText, UNSAFE_getAllByProps } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText('reservationDetail.title')).toBeTruthy();
    });

    const accessiblePressables = UNSAFE_getAllByProps({ accessible: true });

    await act(async () => {
      fireEvent.press(accessiblePressables[0]);
    });

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('opens phone and email links from contact actions', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText('+57 1 000-0000')).toBeTruthy();
      expect(getByText('plaza@test.com')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('+57 1 000-0000'));
      fireEvent.press(getByText('plaza@test.com'));
    });

    expect(openURLSpy).toHaveBeenCalledWith('tel:+571000-0000');
    expect(openURLSpy).toHaveBeenCalledWith('mailto:plaza@test.com');
  });

  it('renders default values when key params are missing', async () => {
    setupParams({
      hotelName: undefined,
      roomType: undefined,
      checkInTime: undefined,
      checkOutTime: undefined,
      checkIn: '',
      checkOut: '',
    });

    const { getByText, getAllByText } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText('reservationDetail.defaultHotel')).toBeTruthy();
      expect(getByText('reservationDetail.standardRoom')).toBeTruthy();
      expect(getByText('reservationDetail.afterTime')).toBeTruthy();
      expect(getByText('reservationDetail.beforeTime')).toBeTruthy();
      expect(getAllByText('-').length).toBeGreaterThan(0);
    });
  });

  it('renders singular labels when one bed, one guest, and one night', async () => {
    setupParams({ roomBeds: '1', guests: '1', nights: '1', total: '200' });
    const { getByText } = render(<MyReservationDetailScreen />);

    await waitFor(() => {
      expect(getByText('reservationDetail.kingBed • reservationDetail.capacity: 4 • 35m²')).toBeTruthy();
      expect(getByText('1 reservationDetail.adult')).toBeTruthy();
      expect(getByText('1 reservationDetail.night × $174 USD')).toBeTruthy();
    });
  });
});
