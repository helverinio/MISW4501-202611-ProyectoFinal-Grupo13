import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import {
  BookingService,
  EstadoResponse,
} from '../services/bookingService';

type PaymentMethod = 'card' | 'paypal' | 'applepay';

interface PaymentParams {
  hotelData: string;
  roomData: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  grandTotal: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  holdId: string;
  taxRate: string;
  taxesAmount: string;
  isModification?: string;
  reservationId?: string;
  originalTotal?: string;
  newTotal?: string;
}

export default function PaymentScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const user = useUserStore((state) => state.user);

  const getParam = (key: string): string => {
    const value = params[key];
    return Array.isArray(value) ? value[0] || '' : value || '';
  };

  const hotelData = JSON.parse(getParam('hotelData') || '{}');
  const roomData = JSON.parse(getParam('roomData') || '{}');
  const checkIn = getParam('checkIn');
  const checkOut = getParam('checkOut');
  const guests = parseInt(getParam('guests') || '1', 10);
  const grandTotal = parseFloat(getParam('grandTotal') || '0');
  const firstName = getParam('firstName');
  const lastName = getParam('lastName');
  const email = getParam('email');
  const phone = getParam('phone');
  const holdId = getParam('holdId');
  const taxRate = parseFloat(getParam('taxRate') || '0.12');
  const taxesAmount = parseFloat(getParam('taxesAmount') || '0');
  const reservationId = getParam('reservationId');
  const originalTotal = parseFloat(getParam('originalTotal') || '0');
  const newTotal = parseFloat(getParam('newTotal') || '0');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    setCardNumber(formatCardNumber(value));
  };

  const handleExpiryChange = (value: string) => {
    setExpiryDate(formatExpiryDate(value));
  };

  const handleCvvChange = (value: string) => {
    setCvv(value.replace(/\D/g, '').slice(0, 4));
  };

  const getCancellationDate = () => {
    if (!checkIn) return '';
    const date = new Date(checkIn + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEarlyBirdDiscount = (checkInDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    const daysInAdvance = Math.floor((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysInAdvance >= 30) return 20;  // 30+ days ahead → $20 off
    if (daysInAdvance >= 14) return 10;  // 14-29 days ahead → $10 off
    if (daysInAdvance >= 7) return 5;    // 7-13 days ahead → $5 off
    return 0;                             // Less than 7 days → no discount
  };

  const earlyBirdDiscount = getEarlyBirdDiscount(checkIn);
  const finalTotal = grandTotal - earlyBirdDiscount;

  const validateForm = (): boolean => {
    if (paymentMethod === 'card') {
      const cleanedCard = cardNumber.replace(/\s/g, '');
      if (cleanedCard.length < 13 || cleanedCard.length > 19) {
        setErrorMessage(t('payment.invalidCard'));
        return false;
      }

      const [month, year] = expiryDate.split('/');
      if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
        setErrorMessage(t('payment.invalidExpiry'));
        return false;
      }

      if (cvv.length < 3) {
        setErrorMessage(t('payment.invalidCvv'));
        return false;
      }

      if (!cardholderName.trim()) {
        setErrorMessage(t('payment.invalidName'));
        return false;
      }
    }

    if (!termsAccepted) {
      setErrorMessage(t('payment.acceptTerms'));
      return false;
    }

    return true;
  };

  const toIsoDate = (value: string): string => {
    return `${value}T00:00:00`;
  };

  const detectCardType = (cardNumber: string): string => {
    const firstDigit = cardNumber.charAt(0);
    const firstTwo = cardNumber.slice(0, 2);
    if (firstDigit === '4') return 'Visa';
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'Mastercard';
    if (['34', '37'].includes(firstTwo)) return 'Amex';
    if (firstTwo === '60' || firstTwo === '65') return 'Discover';
    return 'Card';
  };

  const resolveEstadoId = (estados: EstadoResponse[]): string => {
    const normalized = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const preferred = estados.find((estado) => {
      const name = normalized(estado.nombre || '');
      return (
        name.includes('confirmada') ||
        name.includes('reservada via pms') ||
        name.includes('reservado')
      );
    });

    return preferred?.id || estados[0]?.id || '';
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    setErrorMessage('');

    try {
      const estadosResult = await BookingService.getEstados();
      if (!estadosResult.success || !estadosResult.data) {
        throw new Error('Failed to get estados');
      }

      // Determine isModification by consulting the backend reservation status
      let isModification = false;
      if (reservationId) {
        const reservaResult = await BookingService.getReservaById(reservationId);
        if (reservaResult.success && reservaResult.data) {
          const estadoActual = estadosResult.data.find(
            (e) => e.id === reservaResult.data!.id_estado
          );
          if (estadoActual) {
            const normalizedNombre = estadoActual.nombre
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim();
            isModification =
              normalizedNombre.includes('pago recibido') ||
              normalizedNombre.includes('confirmada');
          }
        }
      }

      // Handle modification scenario - skip reservation creation
      if (isModification && reservationId) {
        // For modifications, just update the existing reservation and process payment
        const confirmedEstado = estadosResult.data.find((estado) => {
          const name = estado.nombre
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
          return (
            name.includes('confirmada') ||
            name.includes('reservada via pms') ||
            name.includes('reservado')
          );
        });

        // Update reservation status to confirmed, set new total, and update dates
        const updateResult = await BookingService.updateReserva(reservationId, {
          id_estado: confirmedEstado?.id || estadosResult.data[0]?.id,
          total: Math.round(newTotal * 100) / 100,
          fecha_ingreso: checkIn,
          fecha_salida: checkOut,
        });

        if (!updateResult.success) {
          router.replace({
            pathname: '/screens/paymentResult',
            params: {
              success: 'false',
              errorMessage: updateResult.error?.message || t('payment.paymentError'),
            },
          });
          return;
        }

        // Navigate to success result for modification
        const checkInDate = new Date(checkIn + 'T00:00:00');
        const checkOutDate = new Date(checkOut + 'T00:00:00');
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const cleanedCard = cardNumber.replace(/\s/g, '');
        const cardLast4 = cleanedCard.slice(-4);
        const cardType = detectCardType(cleanedCard);

        router.replace({
          pathname: '/screens/paymentResult',
          params: {
            success: 'true',
            bookingId: reservationId,
            hotelName: hotelData.nombre,
            roomType: roomData.nombre || roomData.tipo || '',
            rating: (hotelData.rating_promedio ?? 4.5).toString(),
            roomImage: roomData.imagen || hotelData.imagen || '',
            checkIn,
            checkOut,
            nights: nights.toString(),
            guests: guests.toString(),
            roomPrice: (newTotal - taxesAmount).toFixed(2),
            taxesFees: taxesAmount.toFixed(2),
            grandTotal: newTotal.toString(),
            cardLast4,
            cardType,
            isModification: 'true',
            priceDifference: finalTotal.toString(),
          },
        });
        return;
      }

      // Standard new reservation flow
      let idPais = '';
      const paisesResult = await BookingService.getPaises();
      if (paisesResult.success && paisesResult.data && hotelData.pais) {
        const matchedPais = paisesResult.data.find(
          (p) => p.nombre.toLowerCase() === hotelData.pais.toLowerCase()
        );
        if (matchedPais) {
          idPais = matchedPais.id;
        }
      }

      if (!idPais) {
        throw new Error('Could not determine country for reservation');
      }

      const result = await BookingService.createReserva({
        fecha_ingreso: toIsoDate(checkIn),
        fecha_salida: toIsoDate(checkOut),
        total: finalTotal,
        nro_personas: guests,
        id_usuario: String(user?.id),
        id_pais: idPais,
        id_habitacion: roomData.habitacion_id,
        id_estado: resolveEstadoId(estadosResult.data),
        payment_method: 'card',
      });

      if (result.success && result.data) {
        if (result.data.payment?.payment_intent_id) {
          const paymentResult = await BookingService.processPayment(result.data.payment.payment_intent_id);
          if (!paymentResult.success) {
            router.replace({
              pathname: '/screens/paymentResult',
              params: {
                success: 'false',
                errorMessage: paymentResult.error?.message || t('payment.paymentError'),
              },
            });
            return;
          }

          // Update reservation total with finalTotal after successful payment
          await BookingService.updateReserva(result.data.id, {
            total: Math.round(finalTotal * 100) / 100,
          });
        }

        const checkInDate = new Date(checkIn + 'T00:00:00');
        const checkOutDate = new Date(checkOut + 'T00:00:00');
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const taxesFees = taxesAmount;
        const roomPrice = finalTotal - taxesFees;
        const cleanedCard = cardNumber.replace(/\s/g, '');
        const cardLast4 = cleanedCard.slice(-4);
        const cardType = detectCardType(cleanedCard);

        router.replace({
          pathname: '/screens/paymentResult',
          params: {
            success: 'true',
            bookingId: result.data.id,
            hotelName: hotelData.nombre,
            roomType: roomData.nombre || roomData.tipo || '',
            rating: (hotelData.rating_promedio ?? 4.5).toString(),
            roomImage: roomData.imagen || hotelData.imagen || '',
            checkIn,
            checkOut,
            nights: nights.toString(),
            guests: guests.toString(),
            roomPrice: roomPrice.toFixed(2),
            taxesFees: taxesFees.toFixed(2),
            grandTotal: finalTotal.toString(),
            cardLast4,
            cardType,
          },
        });
      } else {
        router.replace({
          pathname: '/screens/paymentResult',
          params: {
            success: 'false',
            errorMessage: result.error?.message || t('payment.paymentError'),
          },
        });
      }
    } catch (error: any) {
      router.replace({
        pathname: '/screens/paymentResult',
        params: {
          success: 'false',
          errorMessage: error.message || t('payment.paymentError'),
        },
      });
    }
  };

  const handleGoBack = async () => {
    router.back();
  };

  const renderPaymentMethodOption = (
    method: PaymentMethod,
    icon: string,
    label: string,
    rightContent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.paymentOption,
        paymentMethod === method && styles.paymentOptionSelected,
      ]}
      onPress={() => setPaymentMethod(method)}
    >
      <View style={styles.paymentOptionLeft}>
        <View
          style={[
            styles.radioOuter,
            paymentMethod === method && styles.radioOuterSelected,
          ]}
        >
          {paymentMethod === method && <View style={styles.radioInner} />}
        </View>
        <Ionicons
          name={icon as any}
          size={20}
          color={paymentMethod === method ? '#4A7BF7' : '#666'}
        />
        <Text
          style={[
            styles.paymentOptionLabel,
            paymentMethod === method && styles.paymentOptionLabelSelected,
          ]}
        >
          {label}
        </Text>
      </View>
      {rightContent}
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>{t('payment.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('payment.subtitle')}</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('payment.paymentMethod')}</Text>

            {renderPaymentMethodOption(
              'card',
              'card',
              t('payment.creditDebitCard'),
              <View style={styles.cardBrands}>
                <View style={[styles.cardBrand, { backgroundColor: '#1A1F71' }]}>
                  <Text style={styles.cardBrandText}>VISA</Text>
                </View>
                <View style={[styles.cardBrand, { backgroundColor: '#EB001B' }]}>
                  <Text style={styles.cardBrandText}>MC</Text>
                </View>
                <View style={[styles.cardBrand, { backgroundColor: '#006FCF' }]}>
                  <Text style={styles.cardBrandText}>AMEX</Text>
                </View>
              </View>
            )}

            {renderPaymentMethodOption(
              'paypal',
              'logo-paypal',
              t('payment.paypal'),
              <Text style={styles.expressText}>{t('payment.expressCheckout')}</Text>
            )}

            {renderPaymentMethodOption(
              'applepay',
              'logo-apple',
              t('payment.applePay'),
              <Text style={styles.touchIdText}>{t('payment.touchId')}</Text>
            )}
          </View>

          {/* Card Details Form */}
          {paymentMethod === 'card' && (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('payment.cardNumber')} *</Text>
                <View style={styles.cardInputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder={t('payment.cardNumberPlaceholder')}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={19}
                    autoComplete="off"
                  />
                  <Ionicons name="card-outline" size={20} color="#999" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>{t('payment.expiryDate')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={handleExpiryChange}
                    placeholder={t('payment.expiryPlaceholder')}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={5}
                    autoComplete="off"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>{t('payment.cvv')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={handleCvvChange}
                    placeholder={t('payment.cvvPlaceholder')}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    autoComplete="off"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('payment.cardholderName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  placeholder={t('payment.cardholderPlaceholder')}
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSaveCard(!saveCard)}
              >
                <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
                  {saveCard && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>{t('payment.saveCard')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fraud Prevention */}
          <View style={styles.fraudSection}>
            <View style={styles.fraudHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
              <View style={styles.fraudHeaderText}>
                <Text style={styles.fraudTitle}>{t('payment.fraudPrevention')}</Text>
                <Text style={styles.fraudDescription}>{t('payment.fraudMessage')}</Text>
              </View>
            </View>
            <View style={styles.fraudBadges}>
              <View style={styles.fraudBadge}>
                <Ionicons name="lock-closed" size={14} color="#666" />
                <Text style={styles.fraudBadgeText}>{t('payment.sslSecured')}</Text>
              </View>
              <View style={styles.fraudBadge}>
                <Ionicons name="shield" size={14} color="#666" />
                <Text style={styles.fraudBadgeText}>{t('payment.pciCompliant')}</Text>
              </View>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            {earlyBirdDiscount > 0 && (
              <View style={styles.discountRow}>
                <View style={styles.discountLabelRow}>
                  <Ionicons name="pricetag" size={16} color="#22C55E" />
                  <Text style={styles.discountLabel}>{t('payment.earlyBirdDiscount')}</Text>
                </View>
                <Text style={styles.discountValue}>-${earlyBirdDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalHeader}>
              <View>
                <Text style={styles.totalLabel}>{t('payment.totalToPay')}</Text>
                <Text style={styles.totalSubtext}>
                  {t('payment.allTaxesIncluded')} • USD
                </Text>
              </View>
              <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.cancellationRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.cancellationText}>
                {t('payment.freeCancellationUntil')} {getCancellationDate()}
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              {t('payment.termsAgreement')}{' '}
              <Text style={styles.termsLink}>{t('payment.cancellationPolicy')}</Text>
              {', '}
              <Text style={styles.termsLink}>{t('payment.termsOfService')}</Text>
              {', '}
              {t('payment.confirmDetails')}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, processing && styles.submitButtonDisabled]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {t('payment.payNow')} - ${finalTotal.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.secureNote}>
            <View style={[styles.brandDot, { backgroundColor: '#1A1F71' }]} />
            <View style={[styles.brandDot, { backgroundColor: '#EB001B' }]} />
            <Text style={styles.secureNoteText}>{t('payment.securedBySSL')}</Text>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#4A7BF7',
    backgroundColor: '#F0F5FF',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#4A7BF7',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A7BF7',
  },
  paymentOptionLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  paymentOptionLabelSelected: {
    color: '#4A7BF7',
  },
  cardBrands: {
    flexDirection: 'row',
    gap: 4,
  },
  cardBrand: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBrandText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  expressText: {
    fontSize: 12,
    color: '#666',
  },
  touchIdText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
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
  cardInputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  fraudSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  fraudHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  fraudHeaderText: {
    flex: 1,
  },
  fraudTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  fraudDescription: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  fraudBadges: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  fraudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fraudBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  totalSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  totalHeader: {
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
    color: '#666',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A7BF7',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  cancellationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancellationText: {
    fontSize: 13,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
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
    backgroundColor: '#4A7BF7',
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
    gap: 6,
  },
  brandDot: {
    width: 20,
    height: 12,
    borderRadius: 2,
  },
  secureNoteText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
});
