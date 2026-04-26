import AsyncStorage from '@react-native-async-storage/async-storage';
import BookingService from '@/services/bookingService';
import { useStaticDataStore } from '../staticDataStore';

jest.mock('@/services/bookingService', () => ({
  __esModule: true,
  default: {
    getEstados: jest.fn(),
    getCiudades: jest.fn(),
    getPaises: jest.fn(),
  },
}));

const mockBookingService = BookingService as jest.Mocked<typeof BookingService>;

const estadosMock = [{ id: '1', nombre: 'Antioquia' }];
const ciudadesMock = [{ id: '1', nombre: 'Medellin', id_pais: '1' }];
const paisesMock = [{ id: '1', nombre: 'Colombia' }];

describe('staticDataStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await AsyncStorage.clear();

    useStaticDataStore.setState({
      estados: [],
      ciudades: [],
      paises: [],
      lastFetchedAt: null,
      isLoading: false,
      error: null,
    });
  });

  describe('isCacheValid', () => {
    it('returns false when no timestamp is available', () => {
      const isValid = useStaticDataStore.getState().isCacheValid();
      expect(isValid).toBe(false);
    });

    it('returns false when one of the collections is empty', () => {
      useStaticDataStore.setState({
        estados: estadosMock,
        ciudades: ciudadesMock,
        paises: [],
        lastFetchedAt: Date.now(),
      });

      const isValid = useStaticDataStore.getState().isCacheValid();
      expect(isValid).toBe(false);
    });

    it('returns true when data exists and has not expired', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      useStaticDataStore.setState({
        estados: estadosMock,
        ciudades: ciudadesMock,
        paises: paisesMock,
        lastFetchedAt: 1_700_000_000_000 - 1_000,
      });

      const isValid = useStaticDataStore.getState().isCacheValid();
      expect(isValid).toBe(true);

      nowSpy.mockRestore();
    });

    it('returns false when cache has expired', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      useStaticDataStore.setState({
        estados: estadosMock,
        ciudades: ciudadesMock,
        paises: paisesMock,
        lastFetchedAt: 1_700_000_000_000 - 24 * 60 * 60 * 1000,
      });

      const isValid = useStaticDataStore.getState().isCacheValid();
      expect(isValid).toBe(false);

      nowSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('clears cached data and metadata', () => {
      useStaticDataStore.setState({
        estados: estadosMock,
        ciudades: ciudadesMock,
        paises: paisesMock,
        lastFetchedAt: Date.now(),
        error: 'some error',
      });

      useStaticDataStore.getState().clearCache();

      const state = useStaticDataStore.getState();
      expect(state.estados).toEqual([]);
      expect(state.ciudades).toEqual([]);
      expect(state.paises).toEqual([]);
      expect(state.lastFetchedAt).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('fetchAndCacheStaticData', () => {
    it('skips fetch when cache is valid', async () => {
      useStaticDataStore.setState({
        estados: estadosMock,
        ciudades: ciudadesMock,
        paises: paisesMock,
        lastFetchedAt: Date.now(),
      });

      await useStaticDataStore.getState().fetchAndCacheStaticData();

      expect(mockBookingService.getEstados).not.toHaveBeenCalled();
      expect(mockBookingService.getCiudades).not.toHaveBeenCalled();
      expect(mockBookingService.getPaises).not.toHaveBeenCalled();
    });

    it('fetches and stores static data when cache is invalid', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      mockBookingService.getEstados.mockResolvedValue({
        success: true,
        data: estadosMock,
      });
      mockBookingService.getCiudades.mockResolvedValue({
        success: true,
        data: ciudadesMock,
      });
      mockBookingService.getPaises.mockResolvedValue({
        success: true,
        data: paisesMock,
      });

      await useStaticDataStore.getState().fetchAndCacheStaticData();

      const state = useStaticDataStore.getState();
      expect(mockBookingService.getEstados).toHaveBeenCalledTimes(1);
      expect(mockBookingService.getCiudades).toHaveBeenCalledTimes(1);
      expect(mockBookingService.getPaises).toHaveBeenCalledTimes(1);
      expect(state.estados).toEqual(estadosMock);
      expect(state.ciudades).toEqual(ciudadesMock);
      expect(state.paises).toEqual(paisesMock);
      expect(state.lastFetchedAt).toBe(1_700_000_000_000);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);

      nowSpy.mockRestore();
    });

    it('keeps previous values for failed individual responses', async () => {
      useStaticDataStore.setState({
        estados: [{ id: 'old', nombre: 'Old Estado' }],
      });

      mockBookingService.getEstados.mockResolvedValue({
        success: false,
        error: { message: 'Failed to get estados' },
      });
      mockBookingService.getCiudades.mockResolvedValue({
        success: true,
        data: ciudadesMock,
      });
      mockBookingService.getPaises.mockResolvedValue({
        success: true,
        data: paisesMock,
      });

      await useStaticDataStore.getState().fetchAndCacheStaticData();

      const state = useStaticDataStore.getState();
      expect(state.estados).toEqual([{ id: 'old', nombre: 'Old Estado' }]);
      expect(state.ciudades).toEqual(ciudadesMock);
      expect(state.paises).toEqual(paisesMock);
      expect(state.lastFetchedAt).not.toBeNull();
      expect(state.error).toBeNull();
    });

    it('sets error when fetch throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      mockBookingService.getEstados.mockRejectedValue(new Error('Network down'));
      mockBookingService.getCiudades.mockResolvedValue({
        success: true,
        data: ciudadesMock,
      });
      mockBookingService.getPaises.mockResolvedValue({
        success: true,
        data: paisesMock,
      });

      await useStaticDataStore.getState().fetchAndCacheStaticData();

      const state = useStaticDataStore.getState();
      expect(state.error).toBe('Network down');
      expect(state.isLoading).toBe(false);
      expect(state.lastFetchedAt).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });
});
