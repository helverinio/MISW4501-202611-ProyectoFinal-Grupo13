import AsyncStorage from '@react-native-async-storage/async-storage';
import ReservationsOfflineCache, {
  CachedReservationsPayload,
  CachedReservationDetailPayload,
} from '../reservationsCache';

jest.mock('@react-native-async-storage/async-storage');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const RESERVATIONS_CACHE_KEY = 'offline-cache:reservations';
const RESERVATION_DETAIL_CACHE_PREFIX = 'offline-cache:reservation-detail:';

describe('ReservationsOfflineCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveList', () => {
    it('should save serialized payload under the user-scoped key', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      const dateBefore = Date.now();

      await ReservationsOfflineCache.saveList('user-1', [{ id: 'r1' }]);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const [key, raw] = mockAsyncStorage.setItem.mock.calls[0];
      expect(key).toBe(`${RESERVATIONS_CACHE_KEY}:user-1`);

      const parsed: CachedReservationsPayload<unknown[]> = JSON.parse(raw as string);
      expect(parsed.userId).toBe('user-1');
      expect(parsed.data).toEqual([{ id: 'r1' }]);
      expect(parsed.cachedAt).toBeGreaterThanOrEqual(dateBefore);
    });

    it('should not throw when AsyncStorage.setItem rejects', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('disk full'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        ReservationsOfflineCache.saveList('user-1', [])
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to cache reservations list:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('loadList', () => {
    it('should return parsed payload when a cached entry exists', async () => {
      const stored: CachedReservationsPayload<{ id: string }[]> = {
        userId: 'user-1',
        data: [{ id: 'r1' }],
        cachedAt: 1_000_000,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));

      const result = await ReservationsOfflineCache.loadList<{ id: string }[]>('user-1');

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        `${RESERVATIONS_CACHE_KEY}:user-1`
      );
      expect(result).toEqual(stored);
    });

    it('should return null when no cached entry exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await ReservationsOfflineCache.loadList('user-1');

      expect(result).toBeNull();
    });

    it('should return null and warn when AsyncStorage.getItem rejects', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('storage error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await ReservationsOfflineCache.loadList('user-1');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to load cached reservations list:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('saveDetail', () => {
    it('should save serialized detail payload under the reservation-scoped key', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      const dateBefore = Date.now();

      await ReservationsOfflineCache.saveDetail('res-42', { status: 'confirmed' });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const [key, raw] = mockAsyncStorage.setItem.mock.calls[0];
      expect(key).toBe(`${RESERVATION_DETAIL_CACHE_PREFIX}res-42`);

      const parsed: CachedReservationDetailPayload<unknown> = JSON.parse(raw as string);
      expect(parsed.reservationId).toBe('res-42');
      expect(parsed.data).toEqual({ status: 'confirmed' });
      expect(parsed.cachedAt).toBeGreaterThanOrEqual(dateBefore);
    });

    it('should not throw when AsyncStorage.setItem rejects', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('write error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        ReservationsOfflineCache.saveDetail('res-42', {})
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to cache reservation detail:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('loadDetail', () => {
    it('should return parsed detail payload when a cached entry exists', async () => {
      const stored: CachedReservationDetailPayload<{ status: string }> = {
        reservationId: 'res-42',
        data: { status: 'confirmed' },
        cachedAt: 2_000_000,
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(stored));

      const result =
        await ReservationsOfflineCache.loadDetail<{ status: string }>('res-42');

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        `${RESERVATION_DETAIL_CACHE_PREFIX}res-42`
      );
      expect(result).toEqual(stored);
    });

    it('should return null when no cached detail exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await ReservationsOfflineCache.loadDetail('res-42');

      expect(result).toBeNull();
    });

    it('should return null and warn when AsyncStorage.getItem rejects', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('read error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await ReservationsOfflineCache.loadDetail('res-42');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to load cached reservation detail:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('should remove all keys that match either cache prefix', async () => {
      const allKeys = [
        `${RESERVATIONS_CACHE_KEY}:user-1`,
        `${RESERVATION_DETAIL_CACHE_PREFIX}res-42`,
        'some-other-key',
      ];
      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys as unknown as readonly string[]);
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      await ReservationsOfflineCache.clearAll();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        `${RESERVATIONS_CACHE_KEY}:user-1`,
        `${RESERVATION_DETAIL_CACHE_PREFIX}res-42`,
      ]);
    });

    it('should not call multiRemove when no matching keys exist', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['some-other-key'] as unknown as readonly string[]);

      await ReservationsOfflineCache.clearAll();

      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    });

    it('should not throw and warn when AsyncStorage.getAllKeys rejects', async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error('keys error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(ReservationsOfflineCache.clearAll()).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to clear reservations cache:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('should not throw and warn when AsyncStorage.multiRemove rejects', async () => {
      const allKeys = [`${RESERVATIONS_CACHE_KEY}:user-1`];
      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys as unknown as readonly string[]);
      mockAsyncStorage.multiRemove.mockRejectedValue(new Error('remove error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(ReservationsOfflineCache.clearAll()).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to clear reservations cache:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });
});
