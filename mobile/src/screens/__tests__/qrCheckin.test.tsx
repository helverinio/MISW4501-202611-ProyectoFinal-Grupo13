import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QrCheckinScreen from '../qrCheckin';
import { router, useLocalSearchParams } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import BookingService from '@/services/bookingService';
import { Linking } from 'react-native';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-camera', () => {
  const CameraViewMock = jest.fn(({ onBarcodeScanned }: any) => {
    // Store the callback so we can trigger it manually
    (CameraViewMock as any).onBarcodeScannedCallback = onBarcodeScanned;
    return null;
  });
  return {
    useCameraPermissions: jest.fn(),
    CameraView: CameraViewMock,
  };
});

jest.mock('@/services/bookingService', () => ({
  __esModule: true,
  default: {
    checkinReserva: jest.fn(),
  },
}));

// Mock Linking.openSettings
jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve() as any);

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseCameraPermissions = useCameraPermissions as jest.Mock;
const mockCheckinReserva = BookingService.checkinReserva as jest.Mock;

const mockSearchParams = {
  reservationId: 'res-123',
  hotelName: 'Grand Hotel Paris',
};

describe('QrCheckinScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue(mockSearchParams);
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]);
    mockCheckinReserva.mockResolvedValue({ success: true, data: {} });
  });

  describe('Camera Permission States', () => {
    it('should render permission denied screen when permission is denied and cannot ask again', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        jest.fn(),
      ]);

      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.cameraPermissionTitle')).toBeTruthy();
      expect(getByText('qrCheckin.cameraPermissionDenied')).toBeTruthy();
      expect(getByText('qrCheckin.openSettings')).toBeTruthy();
      expect(getByText('qrCheckin.backToReservation')).toBeTruthy();
    });

    it('should call Linking.openSettings when open settings button is pressed', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        jest.fn(),
      ]);

      const { getByText } = render(<QrCheckinScreen />);
      
      fireEvent.press(getByText('qrCheckin.openSettings'));
      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('should call router.back when back button is pressed in permission denied state', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        jest.fn(),
      ]);

      const { getByText } = render(<QrCheckinScreen />);
      
      fireEvent.press(getByText('qrCheckin.backToReservation'));
      expect(router.back).toHaveBeenCalled();
    });

    it('should render loading screen when permission is not granted but can ask again', () => {
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: true },
        jest.fn(),
      ]);

      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.cameraPermissionMessage')).toBeTruthy();
    });
  });

  describe('Scanning State', () => {
    it('should render camera view when permission is granted', () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.title')).toBeTruthy();
      expect(getByText('qrCheckin.scanning')).toBeTruthy();
      expect(getByText('Grand Hotel Paris')).toBeTruthy();
    });

    it('should render hotel name in scanning state', () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('Grand Hotel Paris')).toBeTruthy();
    });

    it('should not render hotel name when hotelName is empty', () => {
      mockUseLocalSearchParams.mockReturnValue({
        reservationId: 'res-123',
        hotelName: '',
      });

      const { getByText, queryByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.scanning')).toBeTruthy();
      expect(queryByText('Grand Hotel Paris')).toBeNull();
    });

    it('should call router.back when back button is pressed in scanning state', () => {
      const { UNSAFE_root } = render(<QrCheckinScreen />);
      
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      const backButton = touchables[0];
      
      if (backButton) {
        fireEvent.press(backButton);
        expect(router.back).toHaveBeenCalled();
      }
    });
  });

  describe('QR Scanning Logic', () => {
    it('should process valid JSON QR code with matching reservation ID', async () => {
      render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(mockCheckinReserva).toHaveBeenCalledWith('res-123');
      });
    });

    it('should process raw string QR code with matching reservation ID', async () => {
      render(<QrCheckinScreen />);
      
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: 'res-123' });

      await waitFor(() => {
        expect(mockCheckinReserva).toHaveBeenCalledWith('res-123');
      });
    });

    it('should show error state when QR reservation ID does not match', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'wrong-id' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('qrCheckin.errorInvalidQR')).toBeTruthy();
      });
    });

    it('should show error state when raw string does not match reservation ID', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: 'wrong-id' });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('qrCheckin.errorInvalidQR')).toBeTruthy();
      });
    });

    it('should trim whitespace from raw string QR data', async () => {
      render(<QrCheckinScreen />);
      
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: '  res-123  ' });

      await waitFor(() => {
        expect(mockCheckinReserva).toHaveBeenCalledWith('res-123');
      });
    });

    it('should show success state when checkin is successful', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.successTitle')).toBeTruthy();
        expect(getByText('qrCheckin.successMessage')).toBeTruthy();
      });
    });

    it('should show error state when checkin fails with error message', async () => {
      mockCheckinReserva.mockResolvedValue({
        success: false,
        error: { message: 'Reservation not found' },
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('Reservation not found')).toBeTruthy();
      });
    });

    it('should show error state when checkin fails without error message', async () => {
      mockCheckinReserva.mockResolvedValue({
        success: false,
        error: undefined,
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('qrCheckin.errorGeneric')).toBeTruthy();
      });
    });

    it('should show error state when checkin throws exception', async () => {
      mockCheckinReserva.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('qrCheckin.errorGeneric')).toBeTruthy();
      });
    });

    it('should prevent multiple scans with scannedRef', async () => {
      render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });
      (require('expo-camera').CameraView as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(mockCheckinReserva).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Processing State', () => {
    it('should render processing state while checking in', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      expect(getByText('qrCheckin.processing')).toBeTruthy();
    });
  });

  describe('Success State', () => {
    it('should render success screen with hotel name', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.successTitle')).toBeTruthy();
        expect(getByText('qrCheckin.successMessage')).toBeTruthy();
        expect(getByText('Grand Hotel Paris')).toBeTruthy();
      });
    });

    it('should call router.back when back button is pressed in success state', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        fireEvent.press(getByText('qrCheckin.backToReservation'));
        expect(router.back).toHaveBeenCalled();
      });
    });

    it('should call router.replace when go home button is pressed in success state', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        fireEvent.press(getByText('qrCheckin.goHome'));
        expect(router.replace).toHaveBeenCalledWith('/screens/landing');
      });
    });
  });

  describe('Error State', () => {
    it('should render error screen with error message', async () => {
      mockCheckinReserva.mockResolvedValue({
        success: false,
        error: { message: 'Custom error message' },
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('Custom error message')).toBeTruthy();
      });
    });

    it('should reset state when try again button is pressed', async () => {
      mockCheckinReserva.mockResolvedValue({
        success: false,
        error: { message: 'Error' },
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        fireEvent.press(getByText('qrCheckin.tryAgain'));
      });

      // After pressing try again, should be able to scan again
      mockCheckinReserva.mockResolvedValue({ success: true, data: {} });
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(mockCheckinReserva).toHaveBeenCalledTimes(2);
      });
    });

    it('should call router.back when back button is pressed in error state', async () => {
      mockCheckinReserva.mockResolvedValue({
        success: false,
        error: { message: 'Error' },
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      const qrData = JSON.stringify({ reserva_id: 'res-123' });
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        fireEvent.press(getByText('qrCheckin.backToReservation'));
        expect(router.back).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing reservationId parameter', () => {
      mockUseLocalSearchParams.mockReturnValue({
        reservationId: undefined,
        hotelName: 'Grand Hotel Paris',
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.title')).toBeTruthy();
    });

    it('should handle empty reservationId parameter', () => {
      mockUseLocalSearchParams.mockReturnValue({
        reservationId: '',
        hotelName: 'Grand Hotel Paris',
      });

      const { getByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.title')).toBeTruthy();
    });

    it('should handle missing hotelName parameter', () => {
      mockUseLocalSearchParams.mockReturnValue({
        reservationId: 'res-123',
        hotelName: undefined,
      });

      const { getByText, queryByText } = render(<QrCheckinScreen />);
      
      expect(getByText('qrCheckin.scanning')).toBeTruthy();
      expect(queryByText('Grand Hotel Paris')).toBeNull();
    });

    it('should handle invalid JSON in QR code', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: 'not-valid-json' });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
        expect(getByText('qrCheckin.errorInvalidQR')).toBeTruthy();
      });
    });

    it('should handle JSON payload without reserva_id field', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const CameraViewMock = require('expo-camera').CameraView;
      const qrData = JSON.stringify({ other_field: 'value' });
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
      });
    });

    it('should handle null QR payload', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const CameraViewMock = require('expo-camera').CameraView;
      const qrData = JSON.stringify({ reserva_id: null });
      (CameraViewMock as any).onBarcodeScannedCallback({ data: qrData });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
      });
    });

    it('should handle empty string in QR payload', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: '' });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
      });
    });

    it('should handle whitespace-only QR data', async () => {
      const { getByText } = render(<QrCheckinScreen />);
      
      const CameraViewMock = require('expo-camera').CameraView;
      (CameraViewMock as any).onBarcodeScannedCallback({ data: '   ' });

      await waitFor(() => {
        expect(getByText('qrCheckin.errorTitle')).toBeTruthy();
      });
    });
  });

  describe('Permission Request on Mount', () => {
    it('should request permission when not granted and can ask again', () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: true },
        mockRequestPermission,
      ]);

      render(<QrCheckinScreen />);
      
      // Permission request is triggered in useEffect
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should not request permission when already granted', () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: true, canAskAgain: true },
        mockRequestPermission,
      ]);

      render(<QrCheckinScreen />);
      
      expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('should not request permission when cannot ask again', () => {
      const mockRequestPermission = jest.fn();
      mockUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        mockRequestPermission,
      ]);

      render(<QrCheckinScreen />);
      
      expect(mockRequestPermission).not.toHaveBeenCalled();
    });
  });
});
