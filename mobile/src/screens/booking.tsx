import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { Hotel, Habitacion } from '../services/hotelService';
import { BookingService } from '../services/bookingService';

interface BookingParams {
  hotelData: string;
  roomData: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}

interface HotelWithExtras extends Hotel {
  minPrice: number | null;
  rating_promedio?: number | null;
  cantidad_comentarios?: number | null;
  id_ciudad?: string;
}

interface RoomWithExtras extends Habitacion {
  precio_promedio_noche?: number | null;
  precio_total_reserva?: number | null;
}

const COUNTRY_CODES = [
  { code: '+57', label: 'Colombia (+57)' },
  { code: '+1', label: 'USA (+1)' },
  { code: '+52', label: 'Mexico (+52)' },
  { code: '+54', label: 'Argentina (+54)' },
  { code: '+55', label: 'Brasil (+55)' },
  { code: '+56', label: 'Chile (+56)' },
  { code: '+51', label: 'Peru (+51)' },
  { code: '+593', label: 'Ecuador (+593)' },
];

export default function BookingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const user = useUserStore((state) => state.user);

  const getParam = (key: string): string => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || '' : value || '';
  };

  const hotelData: HotelWithExtras = JSON.parse(getParam('hotelData') || '{}');
  const roomData: RoomWithExtras = JSON.parse(getParam('roomData') || '{}');
  const checkIn = getParam('checkIn');
  const checkOut = getParam('checkOut');
  const guests = parseInt(getParam('guests') || '1', 10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rating = hotelData.rating_promedio ?? null;
  const reviews = hotelData.cantidad_comentarios ?? null;

  const pricePerNight = (roomData as any).precio_promedio_noche ?? 0;
  
  const calculateNights = useCallback(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const value = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return value > 0 ? value : 1;
  }, [checkIn, checkOut]);

  const nights = calculateNights();
  const roomTotal = pricePerNight * nights;
  const taxRate = 0.12; //TODO: Get from backend
  const taxesAmount = Math.round(roomTotal * taxRate * 100) / 100;
  const serviceFee = 8.50; //TODO: Get from backend
  const grandTotal = roomTotal + taxesAmount + serviceFee;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toIsoDate = (value: string): string => {
    return `${value}T00:00:00`;
  };

  const parseBackendDateAsUtc = (value: string): Date => {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const normalized = hasTimezone ? value : `${value}Z`;
    return new Date(normalized);
  };

  const acquireHold = useCallback(async () => {
    if (!user?.id || !roomData.habitacion_id) {
      setLoading(false);
      setErrorMessage(t('booking.missingData'));
      return;
    }

    try {
      const result = await BookingService.acquireRoomHold(roomData.habitacion_id, {
        id_usuario: String(user.id),
        fecha_ingreso: toIsoDate(checkIn),
        fecha_salida: toIsoDate(checkOut),
      });

      if (result.success && result.data) {
        const hold = result.data;
        setHoldId(hold.id);
        const expiresAt = parseBackendDateAsUtc(hold.expires_at);
        setHoldExpiresAt(expiresAt);
      } else {
        setErrorMessage(result.error?.message || t('booking.holdError'));
      }
    } catch (error) {
      setErrorMessage(t('booking.holdError'));
    } finally {
      setLoading(false);
    }
  }, [user, roomData.habitacion_id, checkIn, checkOut, t]);

  useEffect(() => {
    acquireHold();

    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, [acquireHold]);

  useEffect(() => {
    if (!holdExpiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((holdExpiresAt.getTime() - now) / 1000);
      setRemainingSeconds(diff > 0 ? diff : 0);

      if (diff <= 0) {
        if (holdTimerRef.current) {
          clearInterval(holdTimerRef.current);
        }
        handleHoldExpired();
      }
    };

    updateTimer();
    holdTimerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, [holdExpiresAt]);

  const handleHoldExpired = () => {
    Alert.alert(
      t('booking.holdExpiredTitle'),
      t('booking.holdExpiredMessage'),
      [
        {
          text: t('common.ok') || 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins} : ${secs}`;
  };

  const isFormValid = () => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      phone.trim() &&
      termsAccepted &&
      remainingSeconds > 0
    );
  };

  const isEmailValid = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      setErrorMessage(t('booking.fillRequiredFields'));
      return;
    }

    if (!isEmailValid(email)) {
      setErrorMessage(t('booking.invalidEmail'));
      return;
    }

    if (!user?.id) {
      setErrorMessage(t('booking.userRequired'));
      return;
    }

    setErrorMessage('');

    router.push({
      pathname: '/screens/payment',
      params: {
        hotelData: JSON.stringify(hotelData),
        roomData: JSON.stringify(roomData),
        checkIn,
        checkOut,
        guests: guests.toString(),
        grandTotal: grandTotal.toString(),
        taxRate: taxRate.toString(),
        taxesAmount: taxesAmount.toString(),
        firstName,
        lastName,
        email,
        phone: `${phonePrefix}${phone}`,
        holdId: holdId || '',
      },
    });
  };

  const handleGoBack = async () => {
    if (holdId) {
      await BookingService.releaseHold(holdId);
    }
    router.back();
  };

  const renderStars = (ratingValue: number | null) => {
    if (ratingValue === null) return null;
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={12} color="#FFB800" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={12} color="#FFB800" />);
    }
    const emptyStars = 5 - Math.ceil(ratingValue);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#FFB800" />);
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
        <Text style={styles.loadingText}>{t('booking.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{t('booking.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('booking.subtitle')}</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
          </View>
        </View>

        {/* Hold Timer Banner */}
        <View style={styles.holdBanner}>
          <View style={styles.holdBannerLeft}>
            <Ionicons name="time" size={18} color="#fff" />
            <Text style={styles.holdBannerText}>{t('booking.roomReservedFor')}</Text>
          </View>
          <Text style={styles.holdTimer}>{formatCountdown(remainingSeconds)}min</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hotel Summary Card */}
          <View style={styles.hotelCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop' }}
              style={styles.hotelImage}
            />
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{hotelData.nombre}</Text>
              <Text style={styles.roomType}>{roomData.tipo}</Text>
              <View style={styles.ratingRow}>
                {renderStars(rating)}
                {rating !== null && reviews !== null && (
                  <Text style={styles.ratingText}>
                    {rating} ({reviews})
                  </Text>
                )}
              </View>
              <Text style={styles.dates}>
                {formatDate(checkIn)} - {formatDate(checkOut)}
              </Text>
              <Text style={styles.guestsNights}>
                {nights} {t('booking.nights')} • {guests} {t('booking.guestsLabel')}
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Guest Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.guestInfo')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.firstName')} *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('booking.firstNamePlaceholder')}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.lastName')} *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('booking.lastNamePlaceholder')}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.email')} *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('booking.emailPlaceholder')}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.phoneNumber')} *</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefixContainer}>
                  <Text style={styles.phonePrefix}>{phonePrefix}</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('booking.phonePlaceholder')}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.specialRequests')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholder={t('booking.specialRequestsPlaceholder')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.priceBreakdown')}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {t('booking.roomRate')} ({nights} {t('booking.nights')})
              </Text>
              <Text style={styles.priceValue}>${roomTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('booking.taxesFees')}</Text>
              <Text style={styles.priceValue}>${taxesAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.serviceFeeRow}>
                <Text style={styles.priceLabel}>{t('booking.serviceFee')}</Text>
                <Ionicons name="information-circle-outline" size={14} color="#999" />
              </View>
              <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{t('booking.total')}</Text>
                <Text style={styles.totalSubtext}>{t('booking.includesAllTaxes')}</Text>
              </View>
              <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
            </View>

            {/* Currency */}
            <View style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>{t('booking.currency')}</Text>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>USD ($)</Text>
              </View>
            </View>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadgesContainer}>
            <View style={styles.trustBadgeRow}>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                <View>
                  <Text style={styles.trustBadgeTitle}>{t('booking.securePayment')}</Text>
                  <Text style={styles.trustBadgeSubtitle}>{t('booking.sslProtected')}</Text>
                </View>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="calendar-outline" size={20} color="#4A7BF7" />
                <View>
                  <Text style={styles.trustBadgeTitle}>{t('booking.freeCancellation')}</Text>
                  <Text style={styles.trustBadgeSubtitle}>{t('booking.until24h')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.trustBadgeRow}>
              <View style={styles.trustBadge}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
                <View>
                  <Text style={styles.trustBadgeTitle}>{t('booking.instantConfirmation')}</Text>
                  <Text style={styles.trustBadgeSubtitle}>{t('booking.immediateBooking')}</Text>
                </View>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="headset" size={20} color="#8B5CF6" />
                <View>
                  <Text style={styles.trustBadgeTitle}>{t('booking.support247')}</Text>
                  <Text style={styles.trustBadgeSubtitle}>{t('booking.alwaysAvailable')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              {t('booking.agreeToTerms')}{' '}
              <Text style={styles.termsLink}>{t('booking.termsAndConditions')}</Text>
              {' '}{t('booking.and')}{' '}
              <Text style={styles.termsLink}>{t('booking.privacyPolicy')}</Text>.
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid() || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>{t('booking.continueToPayment')}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.secureNote}>
            <Ionicons name="lock-closed" size={12} color="#999" />
            <Text style={styles.secureNoteText}>{t('booking.paymentSecure')}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  secureIcon: {
    marginLeft: 12,
  },
  holdBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  holdBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  holdTimer: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  hotelCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  hotelInfo: {
    flex: 1,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roomType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  dates: {
    fontSize: 13,
    color: '#333',
    marginTop: 6,
  },
  guestsNights: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  phoneRow: {
    flexDirection: 'row',
  },
  phonePrefixContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  phonePrefix: {
    fontSize: 15,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  serviceFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: '#22C55E',
  },
  discountValue: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
  },
  currencyBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currencyText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  trustBadgesContainer: {
    padding: 16,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  trustBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  trustBadgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  trustBadgeSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A7BF7',
    borderColor: '#4A7BF7',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4A7BF7',
    textDecorationLine: 'underline',
  },
  bottomSpacing: {
    height: 24,
  },
  submitContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  secureNoteText: {
    fontSize: 12,
    color: '#999',
  },
});
