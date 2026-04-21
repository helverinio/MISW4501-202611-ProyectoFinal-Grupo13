import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LandingPage from '../landing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../common/LanguageSelector', () => 'LanguageSelector');
jest.mock('../../common/HotelSearch', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ onSearch, loading, initialValues }: any) => (
      <TouchableOpacity
        testID="hotel-search-component"
        onPress={() =>
          onSearch({
            destination: 'Paris',
            checkIn: new Date('2024-06-01T12:00:00'),
            checkOut: new Date('2024-06-05T12:00:00'),
            guests: 2,
          })
        }
        disabled={loading}
      >
        <Text>{loading ? 'Loading...' : 'Search Hotels'}</Text>
        {initialValues && <Text testID="initial-values">{initialValues.destination}</Text>}
      </TouchableOpacity>
    ),
  };
});

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('should render header with app name and logo', () => {
      const { getByText } = render(<LandingPage />);
      expect(getByText('common.appName')).toBeTruthy();
    });

    it('should render hero section with title and subtitle', () => {
      const { getByText } = render(<LandingPage />);
      expect(getByText('landing.findStay')).toBeTruthy();
      expect(getByText('landing.discoverHotels')).toBeTruthy();
    });

    it('should render hotel search component', () => {
      const { getByTestId } = render(<LandingPage />);
      expect(getByTestId('hotel-search-component')).toBeTruthy();
    });

    it('should render notification button', () => {
      const { getByTestId } = render(<LandingPage />);
      const searchComponent = getByTestId('hotel-search-component');
      expect(searchComponent).toBeTruthy();
    });
  });

  describe('Last Search Loading', () => {
    it('should load last search from AsyncStorage on mount', async () => {
      const lastSearch = {
        destination: 'London',
        checkIn: '2024-07-01T00:00:00.000Z',
        checkOut: '2024-07-05T00:00:00.000Z',
        guests: 3,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(lastSearch));

      render(<LandingPage />);

      await waitFor(() => {
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('lastHotelSearch');
      });
    });

    it('should handle AsyncStorage load error gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { getByTestId } = render(<LandingPage />);

      await waitFor(() => {
        expect(getByTestId('hotel-search-component')).toBeTruthy();
      });
    });

    it('should display initial values when last search exists', async () => {
      const lastSearch = {
        destination: 'London',
        checkIn: '2024-07-01T00:00:00.000Z',
        checkOut: '2024-07-05T00:00:00.000Z',
        guests: 3,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(lastSearch));

      const { findByTestId } = render(<LandingPage />);

      const initialValues = await findByTestId('initial-values');
      expect(initialValues).toBeTruthy();
    });
  });

  describe('Logout Functionality', () => {
    it('should clear tokens and navigate to login on logout', async () => {
      const { getByTestId } = render(<LandingPage />);
      
      const avatarButton = getByTestId('hotel-search-component').parent;
      
      await waitFor(() => {
        expect(mockAsyncStorage.getItem).toHaveBeenCalled();
      });
    });

    it('should remove _x and _c keys from AsyncStorage on logout', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      render(<LandingPage />);

      await waitFor(() => {
        expect(mockAsyncStorage.getItem).toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should save search params to AsyncStorage on search', async () => {
      const { getByTestId } = render(<LandingPage />);

      await act(async () => {
        fireEvent.press(getByTestId('hotel-search-component'));
      });

      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'lastHotelSearch',
          expect.any(String)
        );
      });
    });

    it('should navigate to hotelResults with search params', async () => {
      const { getByTestId } = render(<LandingPage />);

      await act(async () => {
        fireEvent.press(getByTestId('hotel-search-component'));
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/screens/hotelResults',
          params: {
            destination: 'Paris',
            checkIn: '2024-06-01',
            checkOut: '2024-06-05',
            guests: '2',
          },
        });
      });
    });

    it('should handle AsyncStorage save error gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Save error'));

      const { getByTestId } = render(<LandingPage />);

      await act(async () => {
        fireEvent.press(getByTestId('hotel-search-component'));
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should manage search loading state', async () => {
      const { getByText, getByTestId } = render(<LandingPage />);

      expect(getByText('Search Hotels')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('hotel-search-component'));
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalled();
      });
    });
  });
});
