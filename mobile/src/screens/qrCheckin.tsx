import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import BookingService from '@/services/bookingService';

type CheckinState = 'scanning' | 'processing' | 'success' | 'error';

export default function QrCheckinScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    reservationId: string;
    hotelName: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<CheckinState>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const scannedRef = useRef(false);

  const reservationId = params.reservationId ?? '';
  const hotelName = params.hotelName ?? '';

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    console.log('[QR-Checkin] Raw scanned data:', data);
    console.log('[QR-Checkin] Expected reservationId (from params):', reservationId);

    setState('processing');

    try {
      let qrPayload: { reserva_id?: string } | null = null;
      try {
        qrPayload = JSON.parse(data);
        console.log('[QR-Checkin] Parsed JSON payload:', JSON.stringify(qrPayload));
      } catch {
        console.log('[QR-Checkin] Data is NOT valid JSON, using raw string');
        qrPayload = null;
      }

      const qrReservaId = qrPayload?.reserva_id ?? data.trim();
      console.log('[QR-Checkin] Extracted qrReservaId:', qrReservaId);
      console.log('[QR-Checkin] Comparison: qrReservaId === reservationId →', qrReservaId === reservationId);

      if (qrReservaId !== reservationId) {
        console.warn('[QR-Checkin] MISMATCH — qrReservaId:', qrReservaId, '| reservationId:', reservationId);
        setState('error');
        setErrorMessage(t('qrCheckin.errorInvalidQR'));
        return;
      }

      console.log('[QR-Checkin] IDs match, calling BookingService.checkinReserva...');
      const result = await BookingService.checkinReserva(reservationId);
      console.log('[QR-Checkin] checkinReserva result:', JSON.stringify(result));

      if (result.success) {
        setState('success');
      } else {
        setState('error');
        setErrorMessage(
          result.error?.message || t('qrCheckin.errorGeneric')
        );
      }
    } catch (error) {
      console.error('[QR-Checkin] Exception during checkin:', error);
      setState('error');
      setErrorMessage(t('qrCheckin.errorGeneric'));
    }
  };

  const handleTryAgain = () => {
    scannedRef.current = false;
    setErrorMessage('');
    setState('scanning');
  };

  const handleBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.replace('/screens/landing');
  };

  // ── Permission denied ──
  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Ionicons name="camera-outline" size={64} color="#94A3B8" />
          <Text style={styles.permissionTitle}>
            {t('qrCheckin.cameraPermissionTitle')}
          </Text>
          <Text style={styles.permissionMessage}>
            {t('qrCheckin.cameraPermissionDenied')}
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.primaryButtonText}>
              {t('qrCheckin.openSettings')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>
              {t('qrCheckin.backToReservation')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Waiting for permission ──
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.permissionMessage}>
            {t('qrCheckin.cameraPermissionMessage')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Processing ──
  if (state === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.processingText}>
            {t('qrCheckin.processing')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success ──
  if (state === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
          </View>
          <Text style={styles.resultTitle}>
            {t('qrCheckin.successTitle')}
          </Text>
          <Text style={styles.resultMessage}>
            {t('qrCheckin.successMessage')}
          </Text>
          <Text style={styles.hotelLabel}>{hotelName}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBack}
          >
            <Text style={styles.primaryButtonText}>
              {t('qrCheckin.backToReservation')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>
              {t('qrCheckin.goHome')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (state === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="close-circle" size={80} color="#DC2626" />
          </View>
          <Text style={styles.resultTitle}>
            {t('qrCheckin.errorTitle')}
          </Text>
          <Text style={styles.resultMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTryAgain}
          >
            <Text style={styles.primaryButtonText}>
              {t('qrCheckin.tryAgain')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBack}
          >
            <Text style={styles.secondaryButtonText}>
              {t('qrCheckin.backToReservation')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Scanning ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('qrCheckin.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />

        {/* Overlay with viewfinder */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.scanInstruction}>
              {t('qrCheckin.scanning')}
            </Text>
            {hotelName ? (
              <Text style={styles.hotelHint}>{hotelName}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const VIEWFINDER_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraWrapper: {
    flex: 1,
  },

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#3B82F6',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 32,
  },
  scanInstruction: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  hotelHint: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },

  // ── Permission ──
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  // ── Result screens ──
  successIcon: {
    marginBottom: 8,
  },
  errorIcon: {
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  hotelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 4,
  },
  processingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },

  // ── Buttons ──
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
});
