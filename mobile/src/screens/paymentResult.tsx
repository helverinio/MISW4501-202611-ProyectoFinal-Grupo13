import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function PaymentResultScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [copied, setCopied] = useState(false);

  const getParam = (key: string): string => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || '' : value || '';
  };

  const success = getParam('success') === 'true';
  const bookingId = getParam('bookingId');
  const hotelName = getParam('hotelName');
  const roomType = getParam('roomType') || t('paymentResult.standardRoom');
  const rating = parseFloat(getParam('rating')) || 4.5;
  const roomImage = getParam('roomImage');
  const checkIn = getParam('checkIn');
  const checkOut = getParam('checkOut');
  const nights = parseInt(getParam('nights')) || 1;
  const guests = parseInt(getParam('guests')) || 2;
  const roomPrice = getParam('roomPrice');
  const taxesFees = getParam('taxesFees');
  const grandTotal = getParam('grandTotal');
  const cardLast4 = getParam('cardLast4');
  const errorMessage = getParam('errorMessage');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatBookingRef = (id: string) => {
    if (!id) return '';
    return `#HTL-${new Date().getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
  };

  const handleCopyBookingRef = async () => {
    const ref = formatBookingRef(bookingId);
    await Clipboard.setStringAsync(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackToHome = () => {
    router.replace('/screens/landing');
  };

  const handleTryAgain = () => {
    router.back();
  };

  const handleViewBookingDetails = () => {
    router.push('/screens/bookings');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={14} color="#FBBF24" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={14} color="#FBBF24" />);
    }
    return stars;
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Green Header */}
          <View style={styles.successHeader}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={40} color="#22C55E" />
            </View>
            <Text style={styles.successTitle}>{t('paymentResult.successTitle')}</Text>
            <Text style={styles.successSubtitle}>{t('paymentResult.bookingConfirmed')}</Text>
          </View>

          <View style={styles.contentContainer}>
            {/* Hotel Card */}
            <View style={styles.hotelCard}>
              <View style={styles.hotelInfo}>
                <View style={styles.hotelDetails}>
                  <Text style={styles.hotelName}>{hotelName || 'Hotel'}</Text>
                  <Text style={styles.roomType}>{roomType}</Text>
                  <View style={styles.ratingContainer}>
                    {renderStars(rating)}
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  </View>
                </View>
                {roomImage ? (
                  <Image source={{ uri: roomImage }} style={styles.roomImage} />
                ) : (
                  <View style={styles.roomImagePlaceholder}>
                    <Ionicons name="bed-outline" size={24} color="#94A3B8" />
                  </View>
                )}
              </View>

              {/* Check-in / Check-out */}
              <View style={styles.datesRow}>
                <View style={styles.dateBox}>
                  <View style={styles.dateHeader}>
                    <Ionicons name="calendar-outline" size={14} color="#22C55E" />
                    <Text style={styles.dateLabel}>{t('paymentResult.checkIn')}</Text>
                  </View>
                  <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
                  <Text style={styles.dateTime}>{t('paymentResult.afterTime')}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateBox}>
                  <View style={styles.dateHeader}>
                    <Ionicons name="calendar-outline" size={14} color="#EF4444" />
                    <Text style={styles.dateLabel}>{t('paymentResult.checkOut')}</Text>
                  </View>
                  <Text style={styles.dateValue}>{formatDate(checkOut)}</Text>
                  <Text style={styles.dateTime}>{t('paymentResult.beforeTime')}</Text>
                </View>
              </View>

              {/* Nights & Guests */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="moon-outline" size={16} color="#64748B" />
                  <Text style={styles.statText}>{nights} {t('paymentResult.nights')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={16} color="#64748B" />
                  <Text style={styles.statText}>{guests} {t('paymentResult.guests')}</Text>
                </View>
              </View>
            </View>

            {/* Booking Reference */}
            <View style={styles.bookingRefCard}>
              <View style={styles.bookingRefContent}>
                <Text style={styles.bookingRefLabel}>{t('paymentResult.bookingReference')}</Text>
                <Text style={styles.bookingRefValue}>{formatBookingRef(bookingId)}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyBookingRef}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#fff" />
                <Text style={styles.copyButtonText}>
                  {copied ? t('paymentResult.copied') : t('paymentResult.copy')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Summary */}
            <View style={styles.paymentSummary}>
              <Text style={styles.sectionTitle}>{t('paymentResult.paymentSummary')}</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t('paymentResult.room')} ({nights} {t('paymentResult.nights')})
                </Text>
                <Text style={styles.summaryValue}>
                  ${roomPrice ? parseFloat(roomPrice).toFixed(2) : '0.00'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('paymentResult.taxesAndFees')}</Text>
                <Text style={styles.summaryValue}>
                  ${taxesFees ? parseFloat(taxesFees).toFixed(2) : '0.00'}
                </Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('paymentResult.totalPaid')}</Text>
                <Text style={styles.totalValue}>
                  ${grandTotal ? parseFloat(grandTotal).toFixed(2) : '0.00'}
                </Text>
              </View>

              {cardLast4 && (
                <View style={styles.cardInfo}>
                  <Ionicons name="card-outline" size={18} color="#64748B" />
                  <Text style={styles.cardText}>•••• {cardLast4} (Visa)</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                </View>
              )}
            </View>

            {/* What's Next Section */}
            <View style={styles.whatsNextSection}>
              <Text style={styles.sectionTitle}>{t('paymentResult.whatsNext')}</Text>
              
              <View style={styles.nextItem}>
                <View style={[styles.nextIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="mail" size={18} color="#22C55E" />
                </View>
                <View style={styles.nextContent}>
                  <Text style={styles.nextTitle}>{t('paymentResult.emailSent')}</Text>
                  <Text style={styles.nextDescription}>{t('paymentResult.emailSentDesc')}</Text>
                </View>
              </View>

              <View style={styles.nextItem}>
                <View style={[styles.nextIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="location" size={18} color="#3B82F6" />
                </View>
                <View style={styles.nextContent}>
                  <Text style={styles.nextTitle}>{t('paymentResult.hotelLocation')}</Text>
                  <Text style={styles.nextDescription}>{t('paymentResult.hotelLocationDesc')}</Text>
                </View>
              </View>

              <View style={styles.nextItem}>
                <View style={[styles.nextIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="notifications" size={18} color="#F59E0B" />
                </View>
                <View style={styles.nextContent}>
                  <Text style={styles.nextTitle}>{t('paymentResult.reminder')}</Text>
                  <Text style={styles.nextDescription}>{t('paymentResult.reminderDesc')}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons Grid */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionGridButton}>
                <Ionicons name="download-outline" size={24} color="#3B82F6" />
                <Text style={styles.actionGridLabel}>{t('paymentResult.download')}</Text>
                <Text style={styles.actionGridSublabel}>{t('paymentResult.eVoucher')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridButton}>
                <Ionicons name="call-outline" size={24} color="#3B82F6" />
                <Text style={styles.actionGridLabel}>{t('paymentResult.contact')}</Text>
                <Text style={styles.actionGridSublabel}>{t('paymentResult.hotel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridButton}>
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                <Text style={styles.actionGridLabel}>{t('paymentResult.addTo')}</Text>
                <Text style={styles.actionGridSublabel}>{t('paymentResult.calendar')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridButton}>
                <Ionicons name="share-outline" size={24} color="#3B82F6" />
                <Text style={styles.actionGridLabel}>{t('paymentResult.share')}</Text>
                <Text style={styles.actionGridSublabel}>{t('paymentResult.details')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewBookingDetails}>
            <Text style={styles.primaryButtonText}>{t('paymentResult.viewBookingDetails')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
            <Text style={styles.secondaryButtonText}>{t('paymentResult.bookAnotherHotel')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.failureContent}>
        {/* Failure Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.failureCircle}>
            <Ionicons name="close" size={60} color="#fff" />
          </View>
        </View>

        {/* Failure Message */}
        <Text style={styles.failureTitle}>{t('paymentResult.failureTitle')}</Text>
        <Text style={styles.failureMessage}>{t('paymentResult.failureMessage')}</Text>

        {/* Error Details */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Help Note */}
        <View style={styles.helpContainer}>
          <View style={styles.helpItem}>
            <Ionicons name="card-outline" size={18} color="#666" />
            <Text style={styles.helpText}>{t('paymentResult.verifyCard')}</Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.helpText}>{t('paymentResult.checkFunds')}</Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="call-outline" size={18} color="#666" />
            <Text style={styles.helpText}>{t('paymentResult.contactBank')}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>{t('paymentResult.tryAgain')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
          <Text style={styles.secondaryButtonText}>{t('paymentResult.backToHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  successHeader: {
    backgroundColor: '#22C55E',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  hotelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hotelDetails: {
    flex: 1,
    marginRight: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  roomType: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  roomImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  roomImagePlaceholder: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
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
    marginHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
  },
  bookingRefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingRefContent: {
    flex: 1,
  },
  bookingRefLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  bookingRefValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  paymentSummary: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22C55E',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  whatsNextSection: {
    marginTop: 24,
  },
  nextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextContent: {
    flex: 1,
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  nextDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  actionGridButton: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionGridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  actionGridSublabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  failureContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  failureCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  failureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  failureMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  helpContainer: {
    width: '100%',
    gap: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748B',
  },
});
