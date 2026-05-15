import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import BookingService from '@/services/bookingService';
import { useStaticDataStore } from '@/store/staticDataStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type CancelReservationParams = {
  reservationId?: string;
  hotelName?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: string;
  guests?: string;
  children?: string;
  total?: string;
  roomType?: string;
};

const CANCELLATION_REASONS = [
  'changePlans',
  'betterPrice',
  'travelRestrictions',
  'bookedMistake',
  'other',
] as const;

type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export default function CancelReservationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<CancelReservationParams>();
  const cachedEstados = useStaticDataStore((state) => state.estados);
  const { isOffline } = useNetworkStatus();

  const [selectedReason, setSelectedReason] = useState<CancellationReason>('changePlans');
  const [comments, setComments] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledEstadoId, setCancelledEstadoId] = useState<string | null>(null);

  const reservationId = params.reservationId || '';
  const hotelName = params.hotelName || '';
  const location = params.location || '';
  const checkIn = params.checkIn || '';
  const checkOut = params.checkOut || '';
  const nights = parseInt(params.nights || '1', 10);
  const guests = parseInt(params.guests || '1', 10);
  const children = parseInt(params.children || '0', 10);
  const total = parseFloat(params.total || '0');
  const roomType = params.roomType || '';

  const bookingId = `TH-${new Date().getFullYear()}-${reservationId.slice(-4).toUpperCase() || '0000'}`;

  const normalize = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const checkInDate = new Date(checkIn + 'T00:00:00');
  const fullRefundCutoff = new Date(checkInDate);
  fullRefundCutoff.setDate(fullRefundCutoff.getDate() - 7);
  const noRefundStart = new Date(checkInDate);
  noRefundStart.setDate(noRefundStart.getDate() - 2);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let estimatedRefund: number;
  if (today >= noRefundStart) {
    estimatedRefund = 0;
  } else if (today >= fullRefundCutoff) {
    estimatedRefund = Math.round(total * 0.5 * 100) / 100;
  } else {
    estimatedRefund = total;
  }

  useEffect(() => {
    loadCancelledEstadoId();
  }, []);

  const loadCancelledEstadoId = async () => {
    const fromStore = cachedEstados.find((e) => normalize(e.nombre).includes('cancel'));
    if (fromStore) {
      setCancelledEstadoId(fromStore.id);
      return;
    }
    try {
      const result = await BookingService.getEstados();
      if (result.success && result.data) {
        const found = result.data.find((e) => normalize(e.nombre).includes('cancel'));
        if (found) {
          setCancelledEstadoId(found.id);
        }
      }
    } catch (error) {
      console.error('Load estados error:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const locale =
      i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatGuestsLabel = (): string => {
    const parts: string[] = [];
    if (guests > 0) {
      parts.push(
        `${guests} ${guests === 1 ? t('cancelReservation.adult') : t('cancelReservation.adults')}`
      );
    }
    if (children > 0) {
      parts.push(
        `${children} ${children === 1 ? t('cancelReservation.child') : t('cancelReservation.children')}`
      );
    }
    return parts.join(', ');
  };

  const getReasonLabel = (reason: CancellationReason): string => {
    switch (reason) {
      case 'changePlans':
        return t('cancelReservation.reasonChangePlans');
      case 'betterPrice':
        return t('cancelReservation.reasonBetterPrice');
      case 'travelRestrictions':
        return t('cancelReservation.reasonTravelRestrictions');
      case 'bookedMistake':
        return t('cancelReservation.reasonBookedMistake');
      case 'other':
        return t('cancelReservation.reasonOther');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleKeepReservation = () => {
    router.back();
  };

  const handleConfirmCancellation = async () => {
    if (!agreedToPolicy) {
      Alert.alert('', t('cancelReservation.agreementRequired'));
      return;
    }
    if (!cancelledEstadoId) {
      Alert.alert('Error', t('cancelReservation.errorMessage'));
      return;
    }
    try {
      setCancelling(true);
      const result = await BookingService.updateReserva(reservationId, {
        id_estado: cancelledEstadoId,
      });
      if (result.success) {
        Alert.alert(
          t('cancelReservation.successTitle'),
          t('cancelReservation.successMessage'),
          [{ text: t('common.ok'), onPress: () => router.back() }]
        );
        // Navigate back with refresh parameter to trigger reload
        router.setParams({ refresh: Date.now().toString() });
      } else {
        Alert.alert('Error', result.error?.message || t('cancelReservation.errorMessage'));
      }
    } catch (error) {
      console.error('Cancel reservation error:', error);
      Alert.alert('Error', t('cancelReservation.errorMessage'));
    } finally {
      setCancelling(false);
    }
  };

  const checkInFormatted =
    checkIn && checkOut
      ? `${formatDate(new Date(checkIn + 'T00:00:00'))} - ${formatDate(new Date(checkOut + 'T00:00:00'))}`
      : '-';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('cancelReservation.title')}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cancellation Warning */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
            <Text style={styles.warningTitle}>{t('cancelReservation.warningTitle')}</Text>
          </View>
          <Text style={styles.warningMessage}>{t('cancelReservation.warningMessage')}</Text>
        </View>

        {/* Reservation Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('cancelReservation.reservationSummary')}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="business" size={20} color="#3B82F6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryPrimary}>{hotelName}</Text>
              <Text style={styles.summarySecondary}>{location}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryPrimary}>{checkInFormatted}</Text>
              <Text style={styles.summarySecondary}>
                {nights} {nights === 1 ? t('cancelReservation.night') : t('cancelReservation.nights')}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="people" size={20} color="#3B82F6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryPrimary}>{formatGuestsLabel()}</Text>
              <Text style={styles.summarySecondary}>{roomType}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryPrimary}>
                {t('cancelReservation.confirmation')}: {bookingId}
              </Text>
              <Text style={styles.summarySecondary}>
                {t('cancelReservation.totalPaid')}: ${total.toFixed(2)}{' '}
                {t('cancelReservation.currency')}
              </Text>
            </View>
          </View>
        </View>

        {/* Refund Policy */}
        <View style={styles.card}>
          <View style={styles.refundPolicyHeader}>
            <Ionicons name="shield-checkmark" size={22} color="#3B82F6" />
            <Text style={styles.refundPolicySectionTitle}>
              {t('cancelReservation.refundPolicy')}
            </Text>
          </View>

          {/* Full Refund */}
          <View style={[styles.refundTier, styles.refundTierGreen]}>
            <View style={styles.refundTierHeader}>
              <View style={styles.refundIconGreen}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
              <View style={styles.refundTierContent}>
                <Text style={styles.refundTierTitleGreen}>
                  {t('cancelReservation.fullRefund')}
                </Text>
                <Text style={styles.refundTierCondition}>
                  {t('cancelReservation.fullRefundCondition', {
                    date: formatDate(fullRefundCutoff),
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.refundAmountRow}>
              <Text style={styles.refundAmountLabel}>{t('cancelReservation.refundAmount')}</Text>
              <Text style={styles.refundAmountGreen}>
                ${total.toFixed(2)} {t('cancelReservation.currency')}
              </Text>
            </View>
          </View>

          {/* Partial Refund */}
          <View style={[styles.refundTier, styles.refundTierAmber]}>
            <View style={styles.refundTierHeader}>
              <View style={styles.refundIconAmber}>
                <Ionicons name="warning" size={20} color="#D97706" />
              </View>
              <View style={styles.refundTierContent}>
                <Text style={styles.refundTierTitleAmber}>
                  {t('cancelReservation.partialRefund')}
                </Text>
                <Text style={styles.refundTierCondition}>
                  {t('cancelReservation.partialRefundCondition', {
                    dateFrom: formatDate(fullRefundCutoff),
                    dateTo: formatDate(noRefundStart),
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.refundDetailRow}>
              <Text style={styles.refundDetailLabel}>{t('cancelReservation.originalAmount')}</Text>
              <Text style={styles.refundDetailValue}>
                ${total.toFixed(2)} {t('cancelReservation.currency')}
              </Text>
            </View>
            <View style={styles.refundDetailRow}>
              <Text style={styles.refundDetailLabel}>
                {t('cancelReservation.cancellationFee')}
              </Text>
              <Text style={styles.refundDetailNegative}>
                -${(total * 0.5).toFixed(2)} {t('cancelReservation.currency')}
              </Text>
            </View>
            <View style={styles.refundAmountRow}>
              <Text style={styles.refundAmountLabel}>{t('cancelReservation.refundAmount')}</Text>
              <Text style={styles.refundAmountAmber}>
                ${(total * 0.5).toFixed(2)} {t('cancelReservation.currency')}
              </Text>
            </View>
          </View>

          {/* No Refund */}
          <View style={[styles.refundTier, styles.refundTierRed]}>
            <View style={styles.refundTierHeader}>
              <View style={styles.refundIconRed}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </View>
              <View style={styles.refundTierContent}>
                <Text style={styles.refundTierTitleRed}>{t('cancelReservation.noRefund')}</Text>
                <Text style={styles.refundTierCondition}>
                  {t('cancelReservation.noRefundCondition', {
                    date: formatDate(noRefundStart),
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.refundAmountRow}>
              <Text style={styles.refundAmountLabel}>{t('cancelReservation.refundAmount')}</Text>
              <Text style={styles.refundAmountRed}>$0 {t('cancelReservation.currency')}</Text>
            </View>
          </View>

          {/* Processing note */}
          <View style={styles.processingNote}>
            <Ionicons
              name="information-circle"
              size={18}
              color="#3B82F6"
              style={styles.processingNoteIcon}
            />
            <Text style={styles.processingNoteText}>{t('cancelReservation.processingNote')}</Text>
          </View>
        </View>

        {/* Reason for Cancellation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('cancelReservation.reasonTitle')}</Text>
          <Text style={styles.reasonSubtitle}>{t('cancelReservation.reasonSubtitle')}</Text>

          {CANCELLATION_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={styles.radioRow}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedReason === reason && styles.radioOuterSelected,
                ]}
              >
                {selectedReason === reason && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{getReasonLabel(reason)}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.commentsInput}
            placeholder={t('cancelReservation.commentsPlaceholder')}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={comments}
            onChangeText={setComments}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom container */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => setAgreedToPolicy(!agreedToPolicy)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToPolicy && styles.checkboxChecked]}>
            {agreedToPolicy && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.agreementText}>{t('cancelReservation.agreementText')}</Text>
        </TouchableOpacity>

        <View style={styles.estimatedRefundRow}>
          <Text style={styles.estimatedRefundLabel}>{t('cancelReservation.estimatedRefund')}</Text>
          <Text style={styles.estimatedRefundAmount}>
            ${estimatedRefund.toFixed(2)} {t('cancelReservation.currency')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.keepButton}
            onPress={handleKeepReservation}
            disabled={cancelling}
          >
            <Text style={styles.keepButtonText}>{t('cancelReservation.keepReservation')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!agreedToPolicy || cancelling || isOffline) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmCancellation}
            disabled={cancelling || isOffline}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {t('cancelReservation.confirmCancellation')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  warningMessage: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  summaryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  summarySecondary: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  refundPolicyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  refundPolicySectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  refundTier: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  refundTierGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  refundTierAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  refundTierRed: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  refundTierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  refundIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  refundIconAmber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  refundIconRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  refundTierContent: {
    flex: 1,
  },
  refundTierTitleGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 2,
  },
  refundTierTitleAmber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  refundTierTitleRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  refundTierCondition: {
    fontSize: 12,
    color: '#64748B',
  },
  refundAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  refundAmountLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  refundAmountGreen: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  refundAmountAmber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  refundAmountRed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  refundDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  refundDetailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  refundDetailValue: {
    fontSize: 13,
    color: '#1E293B',
  },
  refundDetailNegative: {
    fontSize: 13,
    color: '#DC2626',
  },
  processingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  processingNoteIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  processingNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  reasonSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -10,
    marginBottom: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
    backgroundColor: '#FAFAFA',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  commentsInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    backgroundColor: '#FAFAFA',
  },
  bottomSpacer: {
    height: 16,
  },
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  estimatedRefundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  estimatedRefundLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  estimatedRefundAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  keepButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#F87171',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
