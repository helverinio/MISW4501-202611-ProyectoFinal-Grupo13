import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import BookingService, {
  EstadoResponse,
  CiudadResponse,
  PaisResponse,
} from '@/services/bookingService';

const CACHE_KEY = 'static-data-cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StaticDataState {
  estados: EstadoResponse[];
  ciudades: CiudadResponse[];
  paises: PaisResponse[];
  lastFetchedAt: number | null;
  isLoading: boolean;
  error: string | null;

  setEstados: (estados: EstadoResponse[]) => void;
  setCiudades: (ciudades: CiudadResponse[]) => void;
  setPaises: (paises: PaisResponse[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
  fetchAndCacheStaticData: () => Promise<void>;
}

export const useStaticDataStore = create<StaticDataState>()(
  persist(
    (set, get) => ({
      estados: [],
      ciudades: [],
      paises: [],
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      setEstados: (estados) => set({ estados }),
      setCiudades: (ciudades) => set({ ciudades }),
      setPaises: (paises) => set({ paises }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      clearCache: () =>
        set({
          estados: [],
          ciudades: [],
          paises: [],
          lastFetchedAt: null,
          error: null,
        }),

      isCacheValid: () => {
        const { lastFetchedAt, estados, ciudades, paises } = get();
        if (!lastFetchedAt) return false;
        if (estados.length === 0 || ciudades.length === 0 || paises.length === 0) return false;
        const now = Date.now();
        return now - lastFetchedAt < CACHE_DURATION_MS;
      },

      fetchAndCacheStaticData: async () => {
        const { isCacheValid } = get();

        if (isCacheValid()) {
          console.log('Static data cache is valid, skipping fetch');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const [estadosResult, ciudadesResult, paisesResult] = await Promise.all([
            BookingService.getEstados(),
            BookingService.getCiudades(),
            BookingService.getPaises(),
          ]);

          if (estadosResult.success && estadosResult.data) {
            set({ estados: estadosResult.data });
          }

          if (ciudadesResult.success && ciudadesResult.data) {
            set({ ciudades: ciudadesResult.data });
          }

          if (paisesResult.success && paisesResult.data) {
            set({ paises: paisesResult.data });
          }

          set({ lastFetchedAt: Date.now() });
          console.log('Static data cached successfully');
        } catch (error: any) {
          console.error('Error fetching static data:', error);
          set({ error: error.message || 'Failed to fetch static data' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: CACHE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        estados: state.estados,
        ciudades: state.ciudades,
        paises: state.paises,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);

export default useStaticDataStore;
