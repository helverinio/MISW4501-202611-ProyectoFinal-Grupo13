import AsyncStorage from '@react-native-async-storage/async-storage';

const RESERVATIONS_CACHE_KEY = 'offline-cache:reservations';
const RESERVATION_DETAIL_CACHE_PREFIX = 'offline-cache:reservation-detail:';

export interface CachedReservationsPayload<T> {
  userId: string;
  data: T;
  cachedAt: number;
}

export interface CachedReservationDetailPayload<T> {
  reservationId: string;
  data: T;
  cachedAt: number;
}

export const ReservationsOfflineCache = {
  saveList: async <T>(userId: string, data: T): Promise<void> => {
    try {
      const payload: CachedReservationsPayload<T> = {
        userId,
        data,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        `${RESERVATIONS_CACHE_KEY}:${userId}`,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.warn('Failed to cache reservations list:', error);
    }
  },

  loadList: async <T>(userId: string): Promise<CachedReservationsPayload<T> | null> => {
    try {
      const raw = await AsyncStorage.getItem(`${RESERVATIONS_CACHE_KEY}:${userId}`);
      if (!raw) return null;
      return JSON.parse(raw) as CachedReservationsPayload<T>;
    } catch (error) {
      console.warn('Failed to load cached reservations list:', error);
      return null;
    }
  },

  saveDetail: async <T>(reservationId: string, data: T): Promise<void> => {
    try {
      const payload: CachedReservationDetailPayload<T> = {
        reservationId,
        data,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(
        `${RESERVATION_DETAIL_CACHE_PREFIX}${reservationId}`,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.warn('Failed to cache reservation detail:', error);
    }
  },

  loadDetail: async <T>(
    reservationId: string
  ): Promise<CachedReservationDetailPayload<T> | null> => {
    try {
      const raw = await AsyncStorage.getItem(
        `${RESERVATION_DETAIL_CACHE_PREFIX}${reservationId}`
      );
      if (!raw) return null;
      return JSON.parse(raw) as CachedReservationDetailPayload<T>;
    } catch (error) {
      console.warn('Failed to load cached reservation detail:', error);
      return null;
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toRemove = keys.filter(
        (key) =>
          key.startsWith(RESERVATIONS_CACHE_KEY) ||
          key.startsWith(RESERVATION_DETAIL_CACHE_PREFIX)
      );
      if (toRemove.length > 0) {
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (error) {
      console.warn('Failed to clear reservations cache:', error);
    }
  },
};

export default ReservationsOfflineCache;
