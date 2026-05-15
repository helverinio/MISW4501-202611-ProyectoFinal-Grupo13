import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import ReservationsOfflineCache from '@/services/offlineCache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflineBanner from '@/common/OfflineBanner';

type ReservationDetailParams = {
  reservationId?: string;
  hotelId?: string;
  hotelName?: string;
  hotelEmail?: string;
  habitacionId?: string;
  roomType?: string;
  roomCapacity?: string;
  roomBeds?: string;
  location?: string;
  checkIn?: string;
  checkInTime?: string;
  checkOut?: string;
  checkOutTime?: string;
  guests?: string;
  children?: string;
  nights?: string;
  total?: string;
  status?: string;
  rating?: string;
};

interface ReservationDetailVm {
  id: string;
  bookingId: string;
  hotelId: string;
  hotelName: string;
  hotelEmail: string;
  hotelPhone: string;
  hotelAddress: string;
  roomType: string;
  roomDetails: string;
  roomSize: string;
  location: string;
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  checkOutTime: string;
  guests: number;
  guestNames: string;
  nights: number;
  roomRate: number;
  serviceFee: number;
  taxes: number;
  total: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'checked_in';
  isCheckInAvailable: boolean;
  rating: number;
  reviewCount: number;
}

export default function MyReservationDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<ReservationDetailParams>();
  const { isOffline } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<ReservationDetailVm | null>(null);

  useEffect(() => {
    loadReservationDetails();
  }, [params.reservationId]);

  const buildDetailFromParams = (overrides?: Partial<ReservationDetailParams>): ReservationDetailVm => {
    const src = { ...params, ...overrides };
    const nights = parseInt(src.nights || '1', 10);
    const total = parseFloat(src.total || '0');
    // Total includes room rate + 10% taxes + 5% service fee
    // Total = roomRate + 0.10*roomRate + 0.05*roomRate = 1.15*roomRate
    // Therefore: roomRate = total / 1.15
    const roomRate = total / 1.15;
    const serviceFee = roomRate * 0.05;
    const taxes = roomRate * 0.10;

    const bookingId = `TH-${new Date().getFullYear()}-${src.reservationId?.slice(-4).toUpperCase() || '0000'}`;

    const roomBeds = parseInt(src.roomBeds || '1', 10);
    const roomCapacity = parseInt(src.roomCapacity || '2', 10);
    const bedLabel = roomBeds === 1 ? t('reservationDetail.kingBed') : `${roomBeds} ${t('reservationDetail.beds')}`;

    return {
      id: src.reservationId || '',
      bookingId,
      hotelId: src.hotelId || '',
      hotelName: src.hotelName || t('reservationDetail.defaultHotel'),
      hotelEmail: src.hotelEmail || '',
      hotelPhone: '+57 1 000-0000',
      hotelAddress: src.location || '',
      roomType: src.roomType || t('reservationDetail.standardRoom'),
      roomDetails: `${bedLabel} • ${t('reservationDetail.capacity')}: ${roomCapacity}`,
      roomSize: '35m²',
      location: src.location || '',
      checkIn: src.checkIn || '',
      checkInTime: src.checkInTime || t('reservationDetail.afterTime'),
      checkOut: src.checkOut || '',
      checkOutTime: src.checkOutTime || t('reservationDetail.beforeTime'),
      guests: parseInt(src.guests || '1', 10),
      guestNames: '',
      nights,
      roomRate: Math.round(roomRate * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      total,
      status: (src.status as ReservationDetailVm['status']) || 'confirmed',
      isCheckInAvailable: src.status === 'confirmed',
      rating: parseFloat(src.rating || '0.0'),
      reviewCount: Math.floor(Math.random() * 3000) + 500,//TODO: Get from API
    };
  };

  const loadReservationDetails = async () => {
    try {
      setLoading(true);

      if (!params.reservationId) {
        setReservation(null);
        return;
      }

      // Try to fill missing params from the offline cache without replacing values already provided.
      let overrides: Partial<ReservationDetailParams> = {};
      try {
        const cached = await ReservationsOfflineCache.loadDetail<ReservationDetailParams>(
          params.reservationId
        );
        if (cached?.data) {
          const cachedData = cached.data;
          for (const key of Object.keys(cachedData) as (keyof ReservationDetailParams)[]) {
            if (params[key] === undefined && cachedData[key] !== undefined) {
              overrides[key] = cachedData[key];
            }
          }
        }
      } catch (cacheError) {
        console.warn('Offline cache read failed:', cacheError);
      }

      const detail = buildDetailFromParams(overrides);
      setReservation(detail);

      // Persist the latest known params for this reservation so future offline launches can hydrate.
      try {
        await ReservationsOfflineCache.saveDetail(params.reservationId, { ...overrides, ...params });
      } catch (cacheError) {
        console.warn('Offline cache write failed:', cacheError);
      }
    } catch (error) {
      console.error('Load reservation detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    // Parse date string to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    
    // Compare date parts directly
    const isToday = date.getFullYear() === today.getFullYear() &&
                   date.getMonth() === today.getMonth() &&
                   date.getDate() === today.getDate();
    
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES';

    const formatted = date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (isToday) {
      return `${t('reservationDetail.today')}, ${date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`;
    }
    return formatted;
  };

  const handleBack = () => {
    router.back();
  };

  const handleMenu = () => {
    // Menu action placeholder
  };

  const handleSupport = () => {
    // Support action placeholder
  };

  const handleQRCheckIn = () => {
    // QR Check-in action placeholder
  };

  const handleCallHotel = () => {
    if (reservation?.hotelPhone) {
      Linking.openURL(`tel:${reservation.hotelPhone.replace(/\s/g, '')}`);
    }
  };

  const handleEmailHotel = () => {
    if (reservation?.hotelEmail) {
      Linking.openURL(`mailto:${reservation.hotelEmail}`);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>{t('reservationDetail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reservation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{t('reservationDetail.loadError')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>{t('reservationDetail.goBack')}</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>{t('reservationDetail.title')}</Text>
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
        <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <OfflineBanner visible={isOffline} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking ID Card */}
        <View style={styles.card}>
          <View style={styles.bookingIdRow}>
            <Text style={styles.bookingIdLabel}>{t('reservationDetail.bookingId')}</Text>
            <Text style={styles.bookingIdValue}>#{reservation.bookingId}</Text>
          </View>
          {reservation.status === 'checked_in' ? (
            <View style={styles.checkedInBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
              <Text style={styles.checkedInBannerText}>
                {t('reservationDetail.checkedInStatus')}
              </Text>
            </View>
          ) : (
            <View style={styles.checkInStatusRow}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={20} color="#16A34A" />
              </View>
              <View style={styles.checkInStatusContent}>
                <View style={styles.checkInBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.checkInBadgeText}>
                    {t('reservationDetail.checkInAvailable')}
                  </Text>
                </View>
                <Text style={styles.checkInMessage}>
                  {t('reservationDetail.roomReady')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Hotel Card */}
        <View style={styles.card}>
          <View style={styles.hotelCardContent}>
            <View style={styles.hotelImageContainer}>
              <View style={styles.hotelImagePlaceholder}>
                <Ionicons name="business" size={32} color="#94A3B8" />
              </View>
            </View>
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{reservation.hotelName}</Text>
              <View style={styles.ratingRow}>
                {renderStars(reservation.rating)}
                <Text style={styles.ratingText}>
                  {reservation.rating.toFixed(1)} ({reservation.reviewCount.toLocaleString()})
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#3B82F6" />
                <Text style={styles.locationText}>{reservation.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reservation Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('reservationDetail.reservationDetails')}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('reservationDetail.checkIn')}</Text>
              <Text style={styles.detailValue}>{formatDate(reservation.checkIn)}</Text>
              <Text style={styles.detailSubtext}>{reservation.checkInTime}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('reservationDetail.checkOut')}</Text>
              <Text style={styles.detailValue}>{formatDate(reservation.checkOut)}</Text>
              <Text style={styles.detailSubtext}>{reservation.checkOutTime}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="bed" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('reservationDetail.roomType')}</Text>
              <Text style={styles.detailValue}>{reservation.roomType}</Text>
              <Text style={styles.detailSubtext}>
                {reservation.roomDetails} • {reservation.roomSize}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="people" size={20} color="#3B82F6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('reservationDetail.guests')}</Text>
              <Text style={styles.detailValue}>
                {reservation.guests} {reservation.guests === 1 ? t('reservationDetail.adult') : t('reservationDetail.adults')}
              </Text>
              {reservation.guestNames ? (
                <Text style={styles.detailSubtext}>{reservation.guestNames}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Price Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('reservationDetail.priceSummary')}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {reservation.nights} {reservation.nights === 1 ? t('reservationDetail.night') : t('reservationDetail.nights')} × ${(reservation.roomRate / reservation.nights).toFixed(0)} USD
            </Text>
            <Text style={styles.priceValue}>${reservation.roomRate.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('reservationDetail.serviceFee')}</Text>
            <Text style={styles.priceValue}>${reservation.serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('reservationDetail.taxes')}</Text>
            <Text style={styles.priceValue}>${reservation.taxes.toFixed(2)}</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('reservationDetail.totalPaid')}</Text>
            <Text style={styles.totalValue}>${reservation.total.toFixed(2)}USD</Text>
          </View>
        </View>

        {/* Hotel Contact Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('reservationDetail.hotelContact')}</Text>

          <TouchableOpacity style={styles.contactRow} onPress={handleCallHotel}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="call" size={18} color="#64748B" />
            </View>
            <Text style={styles.contactText}>{reservation.hotelPhone}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={handleEmailHotel}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={18} color="#64748B" />
            </View>
            <Text style={styles.contactText}>{reservation.hotelEmail}</Text>
          </TouchableOpacity>

          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="location" size={18} color="#64748B" />
            </View>
            <Text style={styles.contactText}>{reservation.hotelAddress}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
          <Ionicons name="headset" size={20} color="#64748B" />
          <Text style={styles.supportButtonText}>{t('reservationDetail.support')}</Text>
        </TouchableOpacity>

        {reservation.status === 'checked_in' ? (
          <View style={styles.checkedInBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
            <Text style={styles.checkedInBannerText}>
              {t('reservationDetail.checkedInStatus')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.qrCheckInButton} onPress={handleQRCheckIn}>
            <Ionicons name="qr-code" size={20} color="#fff" />
            <Text style={styles.qrCheckInButtonText}>
              {t('reservationDetail.startQRCheckIn')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  menuButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  bookingIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingIdLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  checkInStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInStatusContent: {
    flex: 1,
  },
  checkInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  checkInBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  checkInMessage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  hotelCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  hotelImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hotelImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  checkedInBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkedInBannerText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  qrCheckInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  qrCheckInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});