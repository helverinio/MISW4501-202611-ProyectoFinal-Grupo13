import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PaymentResultScreen from '../paymentResult';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockSetStringAsync = Clipboard.setStringAsync as jest.Mock;

const mockSuccessParams = {
  success: 'true',
  bookingId: 'abc123def456',
  hotelName: 'Grand Hotel Paris',
  roomType: 'Deluxe Suite',
  rating: '4.5',
  roomImage: 'https://example.com/room.jpg',
  checkIn: '2024-06-01',
  checkOut: '2024-06-05',
  nights: '4',
  guests: '2',
  roomPrice: '800.00',
  taxesFees: '96.00',
  grandTotal: '896.00',
  cardLast4: '1234',
  cardType: 'Visa',
};

const mockFailureParams = {
  success: 'false',
  errorMessage: 'Payment declined by bank',
};

describe('PaymentResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseLocalSearchParams.mockReturnValue(mockSuccessParams);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Success State Rendering', () => {
    it('should render success header with checkmark', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.successTitle')).toBeTruthy();
      expect(getByText('paymentResult.bookingConfirmed')).toBeTruthy();
    });

    it('should render hotel name', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('Grand Hotel Paris')).toBeTruthy();
    });

    it('should render room type', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('Deluxe Suite')).toBeTruthy();
    });

    it('should render rating', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('4.5')).toBeTruthy();
    });

    it('should render check-in and check-out labels', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.checkIn')).toBeTruthy();
      expect(getByText('paymentResult.checkOut')).toBeTruthy();
    });

    it('should render nights and guests info', () => {
      const { getAllByText } = render(<PaymentResultScreen />);
      expect(getAllByText(/4.*paymentResult\.nights/).length).toBeGreaterThan(0);
      expect(getAllByText(/2.*paymentResult\.guests/).length).toBeGreaterThan(0);
    });

    it('should render booking reference section', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.bookingReference')).toBeTruthy();
    });

    it('should render payment summary section', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.paymentSummary')).toBeTruthy();
      expect(getByText('paymentResult.taxesAndFees')).toBeTruthy();
      expect(getByText('paymentResult.totalPaid')).toBeTruthy();
    });

    it('should render room price', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('$800.00')).toBeTruthy();
    });

    it('should render taxes and fees', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('$96.00')).toBeTruthy();
    });

    it('should render grand total', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('$896.00')).toBeTruthy();
    });

    it('should render card info when cardLast4 is provided', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText(/1234.*Visa/)).toBeTruthy();
    });

    it('should render whats next section', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.whatsNext')).toBeTruthy();
      expect(getByText('paymentResult.emailSent')).toBeTruthy();
      expect(getByText('paymentResult.hotelLocation')).toBeTruthy();
      expect(getByText('paymentResult.reminder')).toBeTruthy();
    });

    it('should render action grid buttons', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.download')).toBeTruthy();
      expect(getByText('paymentResult.contact')).toBeTruthy();
      expect(getByText('paymentResult.addTo')).toBeTruthy();
      expect(getByText('paymentResult.share')).toBeTruthy();
    });

    it('should render bottom action buttons', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.viewBookingDetails')).toBeTruthy();
      expect(getByText('paymentResult.bookAnotherHotel')).toBeTruthy();
    });
  });

  describe('Failure State Rendering', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue(mockFailureParams);
    });

    it('should render failure title', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureTitle')).toBeTruthy();
    });

    it('should render failure message', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureMessage')).toBeTruthy();
    });

    it('should render error message when provided', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('Payment declined by bank')).toBeTruthy();
    });

    it('should render help items', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.verifyCard')).toBeTruthy();
      expect(getByText('paymentResult.checkFunds')).toBeTruthy();
      expect(getByText('paymentResult.contactBank')).toBeTruthy();
    });

    it('should render try again button', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.tryAgain')).toBeTruthy();
    });

    it('should render back to home button', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.backToHome')).toBeTruthy();
    });

    it('should not render error card when no error message', () => {
      mockUseLocalSearchParams.mockReturnValue({
        success: 'false',
      });
      const { queryByText } = render(<PaymentResultScreen />);
      expect(queryByText('Payment declined by bank')).toBeNull();
    });
  });

  describe('Parameter Handling', () => {
    it('should handle array params for success', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        success: ['true'],
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.successTitle')).toBeTruthy();
    });

    it('should handle array params for bookingId', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        bookingId: ['abc123def456'],
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.bookingReference')).toBeTruthy();
    });

    it('should use default room type when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        roomType: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.standardRoom')).toBeTruthy();
    });

    it('should use default rating when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        rating: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('4.5')).toBeTruthy();
    });

    it('should use default nights when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        nights: '',
      });
      const { getAllByText } = render(<PaymentResultScreen />);
      expect(getAllByText(/1.*paymentResult\.nights/).length).toBeGreaterThan(0);
    });

    it('should use default guests when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        guests: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText(/2.*paymentResult\.guests/)).toBeTruthy();
    });

    it('should use default card type when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        cardType: '',
        cardLast4: '5678',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText(/5678.*Card/)).toBeTruthy();
    });

    it('should handle missing roomPrice', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        roomPrice: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('$0.00')).toBeTruthy();
    });

    it('should handle missing taxesFees', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        taxesFees: '',
        roomPrice: '100.00',
        grandTotal: '100.00',
      });
      const { getAllByText } = render(<PaymentResultScreen />);
      const zeroValues = getAllByText('$0.00');
      expect(zeroValues.length).toBeGreaterThan(0);
    });

    it('should handle missing grandTotal', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        grandTotal: '',
        roomPrice: '100.00',
        taxesFees: '10.00',
      });
      const { getAllByText } = render(<PaymentResultScreen />);
      const zeroValues = getAllByText('$0.00');
      expect(zeroValues.length).toBeGreaterThan(0);
    });

    it('should not render card info when cardLast4 is missing', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        cardLast4: '',
      });
      const { queryByText } = render(<PaymentResultScreen />);
      expect(queryByText(/•••• /)).toBeNull();
    });

    it('should render Hotel as default when hotelName is missing', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        hotelName: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('Hotel')).toBeTruthy();
    });
  });

  describe('Date Formatting', () => {
    it('should format check-in date correctly', () => {
      const { getAllByText } = render(<PaymentResultScreen />);
      expect(getAllByText(/jun/i).length).toBeGreaterThan(0);
    });

    it('should return dash for empty date', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        checkIn: '',
        checkOut: '',
      });
      const { getAllByText } = render(<PaymentResultScreen />);
      const dashes = getAllByText('-');
      expect(dashes.length).toBe(2);
    });
  });

  describe('Booking Reference Formatting', () => {
    it('should format booking reference with year and uppercase id', () => {
      const { getByText } = render(<PaymentResultScreen />);
      const currentYear = new Date().getFullYear();
      expect(getByText(`#HTL-${currentYear}-ABC1`)).toBeTruthy();
    });

    it('should return empty string for empty bookingId', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        bookingId: '',
      });
      const { queryByText } = render(<PaymentResultScreen />);
      expect(queryByText(/#HTL-/)).toBeNull();
    });
  });

  describe('Star Rating', () => {
    it('should render stars for rating 4.5', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('4.5')).toBeTruthy();
    });

    it('should handle integer rating', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        rating: '5',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('5.0')).toBeTruthy();
    });

    it('should handle low rating', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        rating: '2.3',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('2.3')).toBeTruthy();
    });
  });

  describe('Copy Booking Reference', () => {
    it('should copy booking reference when copy button is pressed', async () => {
      const { getByText } = render(<PaymentResultScreen />);
      const copyButton = getByText('paymentResult.copy');
      
      await act(async () => {
        fireEvent.press(copyButton);
      });
      
      const currentYear = new Date().getFullYear();
      expect(mockSetStringAsync).toHaveBeenCalledWith(`#HTL-${currentYear}-ABC1`);
    });

    it('should show copied text after copying', async () => {
      const { getByText } = render(<PaymentResultScreen />);
      const copyButton = getByText('paymentResult.copy');
      
      await act(async () => {
        fireEvent.press(copyButton);
      });
      
      expect(getByText('paymentResult.copied')).toBeTruthy();
    });

    it('should reset copied state after timeout', async () => {
      const { getByText } = render(<PaymentResultScreen />);
      const copyButton = getByText('paymentResult.copy');
      
      await act(async () => {
        fireEvent.press(copyButton);
      });
      
      expect(getByText('paymentResult.copied')).toBeTruthy();
      
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(getByText('paymentResult.copy')).toBeTruthy();
    });
  });

  describe('Navigation - Success State', () => {
    it('should navigate to bookings when view booking details is pressed', () => {
      const { getByText } = render(<PaymentResultScreen />);
      const button = getByText('paymentResult.viewBookingDetails');
      
      fireEvent.press(button);
      
      expect(router.push).toHaveBeenCalledWith('/screens/bookings');
    });

    it('should navigate to landing when book another hotel is pressed', () => {
      const { getByText } = render(<PaymentResultScreen />);
      const button = getByText('paymentResult.bookAnotherHotel');
      
      fireEvent.press(button);
      
      expect(router.replace).toHaveBeenCalledWith('/screens/landing');
    });
  });

  describe('Navigation - Failure State', () => {
    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue(mockFailureParams);
    });

    it('should go back when try again is pressed', () => {
      const { getByText } = render(<PaymentResultScreen />);
      const button = getByText('paymentResult.tryAgain');
      
      fireEvent.press(button);
      
      expect(router.back).toHaveBeenCalled();
    });

    it('should navigate to landing when back to home is pressed', () => {
      const { getByText } = render(<PaymentResultScreen />);
      const button = getByText('paymentResult.backToHome');
      
      fireEvent.press(button);
      
      expect(router.replace).toHaveBeenCalledWith('/screens/landing');
    });
  });

  describe('Room Image', () => {
    it('should render room image when roomImage is provided', () => {
      const { UNSAFE_getByType } = render(<PaymentResultScreen />);
      const Image = require('react-native').Image;
      const images = UNSAFE_getByType(Image);
      expect(images.props.source.uri).toBe('https://example.com/room.jpg');
    });

    it('should render placeholder when roomImage is not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        roomImage: '',
      });
      const { queryByTestId } = render(<PaymentResultScreen />);
      const { UNSAFE_queryByType } = render(<PaymentResultScreen />);
      const Image = require('react-native').Image;
      const images = UNSAFE_queryByType(Image);
      expect(images).toBeNull();
    });
  });

  describe('Time Labels', () => {
    it('should render after time label for check-in', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.afterTime')).toBeTruthy();
    });

    it('should render before time label for check-out', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.beforeTime')).toBeTruthy();
    });
  });

  describe('What\'s Next Descriptions', () => {
    it('should render email sent description', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.emailSentDesc')).toBeTruthy();
    });

    it('should render hotel location description', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.hotelLocationDesc')).toBeTruthy();
    });

    it('should render reminder description', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.reminderDesc')).toBeTruthy();
    });
  });

  describe('Action Grid Sublabels', () => {
    it('should render e-voucher sublabel', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.eVoucher')).toBeTruthy();
    });

    it('should render hotel sublabel', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.hotel')).toBeTruthy();
    });

    it('should render calendar sublabel', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.calendar')).toBeTruthy();
    });

    it('should render details sublabel', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.details')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle success=false string correctly', () => {
      mockUseLocalSearchParams.mockReturnValue({
        success: 'false',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureTitle')).toBeTruthy();
    });

    it('should treat non-true success as failure', () => {
      mockUseLocalSearchParams.mockReturnValue({
        success: 'yes',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureTitle')).toBeTruthy();
    });

    it('should treat empty success as failure', () => {
      mockUseLocalSearchParams.mockReturnValue({
        success: '',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureTitle')).toBeTruthy();
    });

    it('should treat undefined success as failure', () => {
      mockUseLocalSearchParams.mockReturnValue({});
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('paymentResult.failureTitle')).toBeTruthy();
    });

    it('should handle NaN rating gracefully', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        rating: 'invalid',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText('4.5')).toBeTruthy();
    });

    it('should handle NaN nights gracefully', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        nights: 'invalid',
      });
      const { getAllByText } = render(<PaymentResultScreen />);
      expect(getAllByText(/1.*paymentResult\.nights/).length).toBeGreaterThan(0);
    });

    it('should handle NaN guests gracefully', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSuccessParams,
        guests: 'invalid',
      });
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText(/2.*paymentResult\.guests/)).toBeTruthy();
    });
  });

  describe('Payment Summary Room Label', () => {
    it('should show room with nights count', () => {
      const { getByText } = render(<PaymentResultScreen />);
      expect(getByText(/paymentResult\.room.*4.*paymentResult\.nights/)).toBeTruthy();
    });
  });
});
