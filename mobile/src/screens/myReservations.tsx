import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { useStaticDataStore } from '@/store/staticDataStore';
import BookingService, {
  ReservaResponse,
  EstadoResponse,
  HabitacionResponse,
  HotelResponse,
  CiudadResponse,
  PaisResponse,
} from '@/services/bookingService';
import ReservationsOfflineCache from '@/services/offlineCache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflineBanner from '@/common/OfflineBanner';

type ReservationTab = 'upcoming' | 'past' | 'cancelled';
type ReservationStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

interface ReservationItemVm {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelEmail: string;
  habitacionId: string;
  roomType: string;
  roomCapacity: number;
  roomBeds: number;
  location: string;
  pais: string;
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  checkOutTime: string;
  guests: number;
  children: number;
  nights: number;
  total: number;
  status: ReservationStatus;
  rating: number;
}

export default function MyReservationsScreen() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const cachedEstados = useStaticDataStore((state) => state.estados);
  const cachedCiudades = useStaticDataStore((state) => state.ciudades);
  const cachedPaises = useStaticDataStore((state) => state.paises);
  const { isOffline } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reservations, setReservations] = useState<ReservationItemVm[]>([]);
  const [activeTab, setActiveTab] = useState<ReservationTab>('upcoming');
  const [estados, setEstados] = useState<EstadoResponse[]>([]);
  const [isShowingCached, setIsShowingCached] = useState(false);

  const loadFromCache = useCallback(async (userId: string): Promise<boolean> => {
    const cached = await ReservationsOfflineCache.loadList<{
      reservations: ReservationItemVm[];
      estados: EstadoResponse[];
    }>(userId);

    if (cached?.data?.reservations?.length) {
      setReservations(cached.data.reservations);
      setEstados(cached.data.estados || []);
      setIsShowingCached(true);
      return true;
    }
    return false;
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      setErrorMessage('');

      if (!user?.id) {
        setErrorMessage(t('myReservations.missingUser'));
        setLoading(false);
        return;
      }

      const userId = user.id;

      // If offline, load exclusively from AsyncStorage cache
      if (isOffline) {
        const hasCached = await loadFromCache(userId);
        if (!hasCached) {
          setErrorMessage(t('offline.noCachedData'));
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Use cached static data (estados, ciudades, paises) from store
      const estadosData = cachedEstados.length > 0 ? cachedEstados : [];
      const ciudadesData = cachedCiudades.length > 0 ? cachedCiudades : [];
      const paisesData = cachedPaises.length > 0 ? cachedPaises : [];

      // Only fetch dynamic data (reservas, habitaciones, hoteles)
      const [
        reservasResult,
        habitacionesResult,
        hotelesResult,
      ] = await Promise.all([
        BookingService.getReservasByUsuario(userId),
        BookingService.getHabitaciones(),
        BookingService.getHoteles(),
      ]);

      if (!reservasResult.success || !reservasResult.data) {
        // Fallback to cached data on network failure
        const hasCached = await loadFromCache(userId);
        if (!hasCached) {
          setErrorMessage(t('myReservations.loadError'));
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setEstados(estadosData);

      const habitacionesMap = new Map<string, HabitacionResponse>();
      const hotelesMap = new Map<string, HotelResponse>();
      const ciudadesMap = new Map<string, CiudadResponse>();
      const paisesMap = new Map<string, PaisResponse>();

      habitacionesResult.data?.forEach((h) => habitacionesMap.set(h.id, h));
      hotelesResult.data?.forEach((h) => hotelesMap.set(h.id, h));
      ciudadesData.forEach((c) => ciudadesMap.set(c.id, c));
      paisesData.forEach((p) => paisesMap.set(p.id, p));

      const enrichedReservations = reservasResult.data.map((reserva) =>
        enrichReservation(
          reserva,
          estadosData,
          habitacionesMap,
          hotelesMap,
          ciudadesMap,
          paisesMap
        )
      );

      const sorted = enrichedReservations.sort((a, b) =>
        a.checkIn.localeCompare(b.checkIn)
      );

      setReservations(sorted);
      setIsShowingCached(false);

      // Persist a fresh snapshot of the reservations + estados for offline use
      await ReservationsOfflineCache.saveList(userId, {
        reservations: sorted,
        estados: estadosData,
      });
      // Also cache each reservation individually for the detail screen
      await Promise.all(
        sorted.map((r) => ReservationsOfflineCache.saveDetail(r.id, r))
      );
    } catch (error) {
      console.error('Load reservations error:', error);
      // Network/exception path: fallback to cache
      if (user?.id) {
        const hasCached = await loadFromCache(user.id);
        if (!hasCached) {
          setErrorMessage(t('myReservations.loadError'));
        }
      } else {
        setErrorMessage(t('myReservations.loadError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user, cachedEstados, cachedCiudades, cachedPaises, isOffline, loadFromCache]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const enrichReservation = (
    reserva: ReservaResponse,
    estados: EstadoResponse[],
    habitacionesMap: Map<string, HabitacionResponse>,
    hotelesMap: Map<string, HotelResponse>,
    ciudadesMap: Map<string, CiudadResponse>,
    paisesMap: Map<string, PaisResponse>
  ): ReservationItemVm => {
    try {
      const habitacion = habitacionesMap.get(reserva.id_habitacion);
      const pais = paisesMap.get(reserva.id_pais);

      let hotelName = t('myReservations.defaultHotel');
      let location = '';
      let rating = 4.0;
      let hotelId = '';
      let hotelEmail = '';

      const hotel = habitacion ? hotelesMap.get(habitacion.id_hotel) : undefined;

      if (habitacion && hotel) {
        hotelName = hotel.nombre;
        hotelId = hotel.id;
        rating = hotel.rating_promedio || 4.0;
        hotelEmail = hotel.email || '';

        const ciudad = ciudadesMap.get(hotel.id_ciudad);
        if (ciudad) {
          const paisName = pais?.nombre || '';
          location = `${ciudad.nombre}, ${paisName}`;
        }
      }

      if (!location && pais) {
        location = pais.nombre;
      }

      const status = resolveStatus(reserva, estados);
      const nights = getNights(reserva.fecha_ingreso, reserva.fecha_salida);

      return {
        id: reserva.id,
        hotelId,
        hotelName,
        hotelEmail: hotel?.email || '',
        habitacionId: reserva.id_habitacion,
        roomType: habitacion?.tipo || t('myReservations.standardRoom'),
        roomCapacity: habitacion?.capacidad || 2,
        roomBeds: habitacion?.camas || 1,
        location,
        pais: pais?.nombre || '',
        checkIn: toDateOnly(reserva.fecha_ingreso),
        checkInTime: t('myReservations.checkInTime'),
        checkOut: toDateOnly(reserva.fecha_salida),
        checkOutTime: t('myReservations.checkOutTime'),
        guests: reserva.nro_personas,
        children: 0,
        nights,
        total: reserva.total,
        status,
        rating,
      };
    } catch (error) {
      console.error('Enrich reservation error:', error);
      return createFallbackReservation(reserva, estados);
    }
  };

  const createFallbackReservation = (
    reserva: ReservaResponse,
    estados: EstadoResponse[]
  ): ReservationItemVm => {
    const status = resolveStatus(reserva, estados);
    const nights = getNights(reserva.fecha_ingreso, reserva.fecha_salida);

    return {
      id: reserva.id,
      hotelId: '',
      hotelName: t('myReservations.defaultHotelName'),
      hotelEmail: '',
      habitacionId: reserva.id_habitacion,
      roomType: t('myReservations.standardRoom'),
      roomCapacity: 2,
      roomBeds: 1,
      location: t('myReservations.defaultLocation'),
      pais: '',
      checkIn: toDateOnly(reserva.fecha_ingreso),
      checkInTime: t('myReservations.checkInTime'),
      checkOut: toDateOnly(reserva.fecha_salida),
      checkOutTime: t('myReservations.checkOutTime'),
      guests: reserva.nro_personas,
      children: 0,
      nights,
      total: reserva.total,
      status,
      rating: 4.0,
    };
  };

  const resolveStatus = (
    reserva: ReservaResponse,
    estados: EstadoResponse[]
  ): ReservationStatus => {
    const estado =
      estados.find((item) => item.id === reserva.id_estado)?.nombre || '';
    const normalized = normalize(estado);
    const today = new Date();
    const checkout = new Date(reserva.fecha_salida);

    if (normalized.includes('cancel')) {
      return 'cancelled';
    }

    if (checkout.getTime() < new Date(today.toDateString()).getTime()) {
      return 'completed';
    }

    if (normalized.includes('pend')) {
      return 'pending';
    }

    return 'confirmed';
  };

  const normalize = (value: string): string => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const getNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const toDateOnly = (value: string): string => {
    return value.slice(0, 10);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFilteredReservations = (): ReservationItemVm[] => {
    return reservations.filter((reservation) => {
      if (activeTab === 'upcoming') {
        return (
          reservation.status === 'confirmed' || reservation.status === 'pending'
        );
      }
      if (activeTab === 'past') {
        return reservation.status === 'completed';
      }
      if (activeTab === 'cancelled') {
        return reservation.status === 'cancelled';
      }
      return true;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewDetails = (reservation: ReservationItemVm) => {
    router.push({
      pathname: '/screens/myReservationDetail',
      params: {
        reservationId: reservation.id,
        hotelId: reservation.hotelId,
        hotelName: reservation.hotelName,
        hotelEmail: reservation.hotelEmail,
        habitacionId: reservation.habitacionId,
        roomType: reservation.roomType,
        roomCapacity: reservation.roomCapacity.toString(),
        roomBeds: reservation.roomBeds.toString(),
        location: reservation.location,
        checkIn: reservation.checkIn,
        checkInTime: reservation.checkInTime,
        checkOut: reservation.checkOut,
        checkOutTime: reservation.checkOutTime,
        guests: reservation.guests.toString(),
        children: reservation.children.toString(),
        nights: reservation.nights.toString(),
        total: reservation.total.toString(),
        status: reservation.status,
        rating: reservation.rating.toString(),
      },
    } as any);
  };

  const handleModify = (reservation: ReservationItemVm) => {
    if (isOffline) {
      Alert.alert(
        t('offline.actionUnavailableTitle'),
        t('offline.actionUnavailableMessage')
      );
      return;
    }
    router.push({
      pathname: '/screens/editReservation',
      params: {
        reservationId: reservation.id,
        hotelId: reservation.hotelId,
        hotelName: reservation.hotelName,
        habitacionId: reservation.habitacionId,
        roomType: reservation.roomType,
        roomCapacity: reservation.roomCapacity.toString(),
        roomBeds: reservation.roomBeds.toString(),
        location: reservation.location,
        pais: reservation.pais,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        guests: reservation.guests.toString(),
        children: reservation.children.toString(),
        nights: reservation.nights.toString(),
        total: reservation.total.toString(),
      },
    } as any);
  };

  const handleCompletePayment = async (reservation: ReservationItemVm) => {
    if (isOffline) {
      Alert.alert(
        t('offline.actionUnavailableTitle'),
        t('offline.actionUnavailableMessage')
      );
      return;
    }
    try {
      setLoading(true);

      // Acquire hold on the room before proceeding to payment
      const holdResult = await BookingService.acquireRoomHold(reservation.habitacionId, {
        id_usuario: String(user?.id),
        fecha_ingreso: reservation.checkIn,
        fecha_salida: reservation.checkOut,
      });

      if (!holdResult.success || !holdResult.data) {
        Alert.alert('Error', holdResult.error?.message || t('myReservations.loadError'));
        return;
      }

      router.push({
        pathname: '/screens/payment',
        params: {
          reservationId: reservation.id,
          hotelData: JSON.stringify({
            id: reservation.hotelId,
            nombre: reservation.hotelName,
            location: reservation.location,
            pais: reservation.pais,
          }),
          roomData: JSON.stringify({
            habitacion_id: reservation.habitacionId,
            tipo: reservation.roomType,
            capacidad: reservation.roomCapacity,
            camas: reservation.roomBeds,
          }),
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          nights: reservation.nights.toString(),
          guests: reservation.guests.toString(),
          grandTotal: reservation.total.toString(),
          holdId: holdResult.data.id,
        },
      } as any);
    } catch (error) {
      console.error('Complete payment error:', error);
      Alert.alert('Error', t('myReservations.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservation: ReservationItemVm) => {
    if (isOffline) {
      Alert.alert(
        t('offline.actionUnavailableTitle'),
        t('offline.actionUnavailableMessage')
      );
      return;
    }
    try {
      const cancelledEstado = estados.find(
        (e) => normalize(e.nombre).includes('cancel')
      );

      if (cancelledEstado) {
        await BookingService.updateReserva(reservation.id, {
          id_estado: cancelledEstado.id,
        });
        loadReservations();
      }
    } catch (error) {
      console.error('Cancel reservation error:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-${i}`} name="star" size={14} color="#FBBF24" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half-star" name="star-half" size={14} color="#FBBF24" />
      );
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-star-${i}`}
          name="star-outline"
          size={14}
          color="#FBBF24"
        />
      );
    }
    return stars;
  };

  const getStatusBadgeStyle = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#DCFCE7', color: '#16A34A' };
      case 'pending':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#64748B' };
    }
  };

  const getStatusLabel = (status: ReservationStatus): string => {
    switch (status) {
      case 'confirmed':
        return t('myReservations.confirmed');
      case 'pending':
        return t('myReservations.pending');
      case 'cancelled':
        return t('myReservations.cancelledStatus');
      case 'completed':
        return t('myReservations.completed');
      default:
        return status;
    }
  };

  const formatGuestsLabel = (guests: number, children: number): string => {
    const parts = [];
    if (guests > 0) {
      parts.push(
        `${guests} ${guests === 1 ? t('myReservations.adult') : t('myReservations.adults')}`
      );
    }
    if (children > 0) {
      parts.push(
        `${children} ${children === 1 ? t('myReservations.child') : t('myReservations.children')}`
      );
    }
    return parts.join(', ');
  };

  const renderReservationCard = (reservation: ReservationItemVm) => {
    const statusStyle = getStatusBadgeStyle(reservation.status);

    return (
      <View key={reservation.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{reservation.hotelName}</Text>
            <View style={styles.ratingRow}>
              {renderStars(reservation.rating)}
              <Text style={styles.ratingText}>{reservation.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.location}>{reservation.location}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {getStatusLabel(reservation.status)}
            </Text>
          </View>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>{t('myReservations.checkIn')}</Text>
            <Text style={styles.dateValue}>{formatDate(reservation.checkIn)}</Text>
            <Text style={styles.dateTime}>{reservation.checkInTime}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>{t('myReservations.checkOut')}</Text>
            <Text style={styles.dateValue}>{formatDate(reservation.checkOut)}</Text>
            <Text style={styles.dateTime}>{reservation.checkOutTime}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('myReservations.guests')}</Text>
            <Text style={styles.detailValue}>
              {formatGuestsLabel(reservation.guests, reservation.children)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('myReservations.total')}</Text>
            <Text style={styles.totalValue}>${reservation.total} {t('myReservations.currency')}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {reservation.status === 'pending' ? (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, isOffline && styles.disabledButton]}
                onPress={() => handleCompletePayment(reservation)}
                disabled={isOffline}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    isOffline && styles.disabledButtonText,
                  ]}
                >
                  {t('myReservations.completePayment')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, isOffline && styles.disabledButton]}
                onPress={() => handleCancel(reservation)}
                disabled={isOffline}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    isOffline && styles.disabledButtonText,
                  ]}
                >
                  {t('myReservations.cancel')}
                </Text>
              </TouchableOpacity>
            </>
          ) : reservation.status === 'confirmed' ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleViewDetails(reservation)}
              >
                <Text style={styles.primaryButtonText}>
                  {t('myReservations.viewDetails')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, isOffline && styles.disabledButton]}
                onPress={() => handleModify(reservation)}
                disabled={isOffline}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    isOffline && styles.disabledButtonText,
                  ]}
                >
                  {t('myReservations.modify')}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    );
  };

  const filteredReservations = getFilteredReservations();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>{t('myReservations.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t('myReservations.title')}</Text>
          {isOffline ? (
            <Ionicons
              name="cloud-offline"
              size={18}
              color="#DC2626"
              style={styles.headerOfflineIcon}
              testID="offline-header-icon"
            />
          ) : null}
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <OfflineBanner visible={isOffline} />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText,
            ]}
          >
            {t('myReservations.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText,
            ]}
          >
            {t('myReservations.past')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            {t('myReservations.cancelled')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadReservations}>
              <Text style={styles.retryButtonText}>
                {t('myReservations.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('myReservations.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('myReservations.emptySubtitle')}
            </Text>
          </View>
        ) : (
          filteredReservations.map(renderReservationCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerOfflineIcon: {
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#94A3B8',
  },
  menuButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hotelInfo: {
    flex: 1,
    marginRight: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  datesContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});