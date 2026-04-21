import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PaymentScreen from '../payment';
import { router, useLocalSearchParams } from 'expo-router';
import { BookingService } from '../../services/bookingService';
import { useUserStore } from '@/store/userStore';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../services/bookingService', () => ({
  BookingService: {
    getEstados: jest.fn(),
    getPaises: jest.fn(),
    createReserva: jest.fn(),
    processPayment: jest.fn(),
  },
}));

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseUserStore = useUserStore as unknown as jest.Mock;
const mockGetEstados = BookingService.getEstados as jest.Mock;
const mockGetPaises = BookingService.getPaises as jest.Mock;
const mockCreateReserva = BookingService.createReserva as jest.Mock;
const mockProcessPayment = BookingService.processPayment as jest.Mock;

const mockHotelData = {
  hotel_id: 'hotel-1',
  nombre: 'Grand Hotel Paris',
  descripcion: 'Luxury hotel',
  email: 'contact@grandparis.com',
  ciudad: 'Paris',
  pais: 'France',
  amenidades: 'WiFi, Pool',
  minPrice: 150,
  rating_promedio: 4.5,
  cantidad_comentarios: 120,
  imagen: 'https://example.com/hotel.jpg',
};

const mockRoomData = {
  habitacion_id: 'room-1',
  tipo: 'Deluxe Suite',
  nombre: 'Suite Deluxe',
  nro_habitacion: 101,
  capacidad: 2,
  camas: 1,
  precio_promedio_noche: 200,
  moneda: 'USD',
  imagen: 'https://example.com/room.jpg',
};

const mockSearchParams = {
  hotelData: JSON.stringify(mockHotelData),
  roomData: JSON.stringify(mockRoomData),
  checkIn: '2024-06-01',
  checkOut: '2024-06-05',
  guests: '2',
  grandTotal: '850.00',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  holdId: 'hold-123',
  taxRate: '0.12',
  taxesAmount: '102.00',
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  nombre: 'Test User',
};

const mockEstados = [
  { id: 'estado-1', nombre: 'Confirmada' },
  { id: 'estado-2', nombre: 'Pendiente' },
];

const mockPaises = [
  { id: 'pais-1', nombre: 'France' },
  { id: 'pais-2', nombre: 'Spain' },
];

describe('PaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue(mockSearchParams);
    mockUseUserStore.mockImplementation((selector: any) => selector({ user: mockUser }));
    mockGetEstados.mockResolvedValue({ success: true, data: mockEstados });
    mockGetPaises.mockResolvedValue({ success: true, data: mockPaises });
    mockCreateReserva.mockResolvedValue({
      success: true,
      data: { id: 'reserva-123', payment: { payment_id: 'payment-123' } },
    });
    mockProcessPayment.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('should render payment screen with header', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
      expect(getByText('payment.subtitle')).toBeTruthy();
    });

    it('should render payment method section', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.paymentMethod')).toBeTruthy();
      expect(getByText('payment.creditDebitCard')).toBeTruthy();
      expect(getByText('payment.paypal')).toBeTruthy();
      expect(getByText('payment.applePay')).toBeTruthy();
    });

    it('should render card form when card payment method is selected', () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      expect(getByText(/payment\.cardNumber/)).toBeTruthy();
      expect(getByText(/payment\.expiryDate/)).toBeTruthy();
      expect(getByText(/payment\.cvv/)).toBeTruthy();
      expect(getByText(/payment\.cardholderName/)).toBeTruthy();
    });

    it('should render fraud prevention section', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.fraudPrevention')).toBeTruthy();
      expect(getByText('payment.fraudMessage')).toBeTruthy();
      expect(getByText('payment.sslSecured')).toBeTruthy();
      expect(getByText('payment.pciCompliant')).toBeTruthy();
    });

    it('should render total section', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.totalToPay')).toBeTruthy();
      expect(getByText(/payment\.allTaxesIncluded/)).toBeTruthy();
    });

    it('should render terms agreement', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.cancellationPolicy')).toBeTruthy();
      expect(getByText('payment.termsOfService')).toBeTruthy();
    });

    it('should render pay button', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText(/payment\.payNow/)).toBeTruthy();
    });
  });

  describe('Payment Method Selection', () => {
    it('should have card as default payment method', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText(/payment\.cardNumber/)).toBeTruthy();
    });

    it('should hide card form when paypal is selected', () => {
      const { getByText, queryByText } = render(<PaymentScreen />);
      
      fireEvent.press(getByText('payment.paypal'));
      
      expect(queryByText(/payment\.cardNumber/)).toBeNull();
    });

    it('should hide card form when apple pay is selected', () => {
      const { getByText, queryByText } = render(<PaymentScreen />);
      
      fireEvent.press(getByText('payment.applePay'));
      
      expect(queryByText(/payment\.cardNumber/)).toBeNull();
    });

    it('should show card form when switching back to card', () => {
      const { getByText, queryByText } = render(<PaymentScreen />);
      
      fireEvent.press(getByText('payment.paypal'));
      expect(queryByText(/payment\.cardNumber/)).toBeNull();
      
      fireEvent.press(getByText('payment.creditDebitCard'));
      expect(getByText(/payment\.cardNumber/)).toBeTruthy();
    });
  });

  describe('Card Number Formatting', () => {
    it('should format card number with spaces', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cardNumberPlaceholder');
      
      fireEvent.changeText(input, '4111111111111111');
      
      expect(input.props.value).toBe('4111 1111 1111 1111');
    });

    it('should remove non-numeric characters from card number', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cardNumberPlaceholder');
      
      fireEvent.changeText(input, '4111-1111-1111-1111');
      
      expect(input.props.value).toBe('4111 1111 1111 1111');
    });

    it('should limit card number to 19 characters including spaces', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cardNumberPlaceholder');
      
      fireEvent.changeText(input, '41111111111111112222');
      
      expect(input.props.value.length).toBeLessThanOrEqual(19);
    });
  });

  describe('Expiry Date Formatting', () => {
    it('should format expiry date with slash', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.expiryPlaceholder');
      
      fireEvent.changeText(input, '1225');
      
      expect(input.props.value).toBe('12/25');
    });

    it('should handle partial expiry input', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.expiryPlaceholder');
      
      fireEvent.changeText(input, '1');
      
      expect(input.props.value).toBe('1');
    });

    it('should remove non-numeric characters from expiry', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.expiryPlaceholder');
      
      fireEvent.changeText(input, '12/25');
      
      expect(input.props.value).toBe('12/25');
    });
  });

  describe('CVV Input', () => {
    it('should limit CVV to 4 digits', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cvvPlaceholder');
      
      fireEvent.changeText(input, '12345');
      
      expect(input.props.value).toBe('1234');
    });

    it('should remove non-numeric characters from CVV', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cvvPlaceholder');
      
      fireEvent.changeText(input, '12a3');
      
      expect(input.props.value).toBe('123');
    });
  });

  describe('Cardholder Name Input', () => {
    it('should accept cardholder name', () => {
      const { getByPlaceholderText } = render(<PaymentScreen />);
      const input = getByPlaceholderText('payment.cardholderPlaceholder');
      
      fireEvent.changeText(input, 'JOHN DOE');
      
      expect(input.props.value).toBe('JOHN DOE');
    });
  });

  describe('Save Card Checkbox', () => {
    it('should toggle save card checkbox', () => {
      const { getByText } = render(<PaymentScreen />);
      const checkbox = getByText('payment.saveCard');
      
      fireEvent.press(checkbox);
      fireEvent.press(checkbox);
    });
  });

  describe('Terms Acceptance', () => {
    it('should toggle terms checkbox', () => {
      const { getByText } = render(<PaymentScreen />);
      
      fireEvent.press(getByText(/payment\.termsAgreement/));
    });
  });

  describe('Form Validation', () => {
    it('should show error when card number is too short', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '1225');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      fireEvent.press(getByText(/payment\.payNow/));
      
      await waitFor(() => {
        expect(getByText('payment.invalidCard')).toBeTruthy();
      });
    });

    it('should show error when expiry date is invalid', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '13/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      fireEvent.press(getByText(/payment\.payNow/));
      
      await waitFor(() => {
        expect(getByText('payment.invalidExpiry')).toBeTruthy();
      });
    });

    it('should show error when CVV is too short', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '12');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      fireEvent.press(getByText(/payment\.payNow/));
      
      await waitFor(() => {
        expect(getByText('payment.invalidCvv')).toBeTruthy();
      });
    });

    it('should show error when cardholder name is empty', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      fireEvent.press(getByText(/payment\.payNow/));
      
      await waitFor(() => {
        expect(getByText('payment.invalidName')).toBeTruthy();
      });
    });

    it('should show error when terms are not accepted', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      
      fireEvent.press(getByText(/payment\.payNow/));
      
      await waitFor(() => {
        expect(getByText('payment.acceptTerms')).toBeTruthy();
      });
    });

    it('should not require card details for paypal', async () => {
      const { getByText, queryByText } = render(<PaymentScreen />);
      
      fireEvent.press(getByText('payment.paypal'));
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      expect(queryByText('payment.invalidCard')).toBeNull();
    });
  });

  describe('Payment Processing', () => {
    const fillValidCardForm = (getByPlaceholderText: any, getByText: any) => {
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
    };

    it('should call booking service on successful payment', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockGetEstados).toHaveBeenCalled();
        expect(mockGetPaises).toHaveBeenCalled();
      });
    });

    it('should navigate to success result on successful payment', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'true',
            }),
          })
        );
      });
    });

    it('should navigate to error result when estados fetch fails', async () => {
      mockGetEstados.mockResolvedValue({ success: false });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'false',
            }),
          })
        );
      });
    });

    it('should navigate to error result when country not found', async () => {
      mockGetPaises.mockResolvedValue({ success: true, data: [{ id: 'pais-1', nombre: 'Germany' }] });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'false',
            }),
          })
        );
      });
    });

    it('should navigate to error result when reserva creation fails', async () => {
      mockCreateReserva.mockResolvedValue({ success: false, error: { message: 'Creation failed' } });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'false',
            }),
          })
        );
      });
    });

    it('should navigate to error result when payment processing fails', async () => {
      mockProcessPayment.mockResolvedValue({ success: false, error: { message: 'Payment declined' } });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'false',
            }),
          })
        );
      });
    });

    it('should handle exception during payment', async () => {
      mockGetEstados.mockRejectedValue(new Error('Network error'));
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fillValidCardForm(getByPlaceholderText, getByText);
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/screens/paymentResult',
            params: expect.objectContaining({
              success: 'false',
              errorMessage: 'Network error',
            }),
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByTestId, UNSAFE_getAllByType } = render(<PaymentScreen />);
      
      const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      const backButton = touchables[0];
      
      fireEvent.press(backButton);
      
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Param Parsing', () => {
    it('should handle array params for hotelData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        hotelData: [JSON.stringify(mockHotelData)],
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });

    it('should handle array params for roomData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: [JSON.stringify(mockRoomData)],
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });

    it('should handle missing grandTotal', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        grandTotal: undefined,
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });

    it('should default guests to 1 when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        guests: undefined,
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });

    it('should handle empty hotelData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        hotelData: '{}',
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });

    it('should handle empty roomData', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        roomData: '{}',
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.title')).toBeTruthy();
    });
  });

  describe('Early Bird Discount', () => {
    it('should show discount when booking 30+ days in advance', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 35);
      const futureCheckIn = futureDate.toISOString().split('T')[0];
      
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: futureCheckIn,
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.earlyBirdDiscount')).toBeTruthy();
      expect(getByText('-$20.00')).toBeTruthy();
    });

    it('should show $10 discount when booking 14-29 days in advance', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const futureCheckIn = futureDate.toISOString().split('T')[0];
      
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: futureCheckIn,
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.earlyBirdDiscount')).toBeTruthy();
      expect(getByText('-$10.00')).toBeTruthy();
    });

    it('should show $5 discount when booking 7-13 days in advance', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureCheckIn = futureDate.toISOString().split('T')[0];
      
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: futureCheckIn,
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText('payment.earlyBirdDiscount')).toBeTruthy();
      expect(getByText('-$5.00')).toBeTruthy();
    });

    it('should not show discount when booking less than 7 days in advance', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureCheckIn = futureDate.toISOString().split('T')[0];
      
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: futureCheckIn,
      });
      
      const { queryByText } = render(<PaymentScreen />);
      expect(queryByText('payment.earlyBirdDiscount')).toBeNull();
    });
  });

  describe('Card Type Detection', () => {
    const fillCardAndSubmit = async (
      cardNumber: string,
      getByPlaceholderText: any,
      getByText: any
    ) => {
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), cardNumber);
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
    };

    it('should detect Visa card', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      await fillCardAndSubmit('4111111111111111', getByPlaceholderText, getByText);
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              cardType: 'Visa',
            }),
          })
        );
      });
    });

    it('should detect Mastercard', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      await fillCardAndSubmit('5111111111111118', getByPlaceholderText, getByText);
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              cardType: 'Mastercard',
            }),
          })
        );
      });
    });

    it('should detect Amex card', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      await fillCardAndSubmit('341111111111111', getByPlaceholderText, getByText);
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              cardType: 'Amex',
            }),
          })
        );
      });
    });

    it('should detect Discover card', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      await fillCardAndSubmit('6011111111111117', getByPlaceholderText, getByText);
      
      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              cardType: 'Discover',
            }),
          })
        );
      });
    });
  });

  describe('Estado Resolution', () => {
    it('should resolve estado with confirmada in name', async () => {
      mockGetEstados.mockResolvedValue({
        success: true,
        data: [
          { id: 'estado-pending', nombre: 'Pendiente' },
          { id: 'estado-confirmed', nombre: 'Confirmada' },
        ],
      });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockCreateReserva).toHaveBeenCalledWith(
          expect.objectContaining({
            id_estado: 'estado-confirmed',
          })
        );
      });
    });

    it('should resolve estado with reservada via pms in name', async () => {
      mockGetEstados.mockResolvedValue({
        success: true,
        data: [
          { id: 'estado-pending', nombre: 'Pendiente' },
          { id: 'estado-pms', nombre: 'Reservada via PMS' },
        ],
      });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockCreateReserva).toHaveBeenCalledWith(
          expect.objectContaining({
            id_estado: 'estado-pms',
          })
        );
      });
    });

    it('should fallback to first estado when no preferred found', async () => {
      mockGetEstados.mockResolvedValue({
        success: true,
        data: [
          { id: 'estado-first', nombre: 'Pendiente' },
          { id: 'estado-second', nombre: 'Cancelada' },
        ],
      });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockCreateReserva).toHaveBeenCalledWith(
          expect.objectContaining({
            id_estado: 'estado-first',
          })
        );
      });
    });
  });

  describe('Reserva Creation Parameters', () => {
    it('should create reserva with correct parameters', async () => {
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockCreateReserva).toHaveBeenCalledWith(
          expect.objectContaining({
            fecha_ingreso: '2024-06-01T00:00:00',
            fecha_salida: '2024-06-05T00:00:00',
            nro_personas: 2,
            id_usuario: 'user-123',
            id_pais: 'pais-1',
            id_habitacion: 'room-1',
            payment_method: 'card',
          })
        );
      });
    });
  });

  describe('Payment Without Payment ID', () => {
    it('should navigate to success without processing payment when no payment_id', async () => {
      mockCreateReserva.mockResolvedValue({
        success: true,
        data: { id: 'reserva-123' },
      });
      
      const { getByText, getByPlaceholderText } = render(<PaymentScreen />);
      
      fireEvent.changeText(getByPlaceholderText('payment.cardNumberPlaceholder'), '4111111111111111');
      fireEvent.changeText(getByPlaceholderText('payment.expiryPlaceholder'), '12/25');
      fireEvent.changeText(getByPlaceholderText('payment.cvvPlaceholder'), '123');
      fireEvent.changeText(getByPlaceholderText('payment.cardholderPlaceholder'), 'JOHN DOE');
      fireEvent.press(getByText(/payment\.termsAgreement/));
      
      await act(async () => {
        fireEvent.press(getByText(/payment\.payNow/));
      });
      
      await waitFor(() => {
        expect(mockProcessPayment).not.toHaveBeenCalled();
        expect(router.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              success: 'true',
            }),
          })
        );
      });
    });
  });

  describe('Cancellation Date Display', () => {
    it('should show free cancellation date', () => {
      const { getByText } = render(<PaymentScreen />);
      expect(getByText(/payment\.freeCancellationUntil/)).toBeTruthy();
    });

    it('should handle empty checkIn for cancellation date', () => {
      mockUseLocalSearchParams.mockReturnValue({
        ...mockSearchParams,
        checkIn: '',
      });
      
      const { getByText } = render(<PaymentScreen />);
      expect(getByText(/payment\.freeCancellationUntil/)).toBeTruthy();
    });
  });
});
