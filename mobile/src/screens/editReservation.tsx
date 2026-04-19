import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { HotelService, Habitacion } from '@/services/hotelService';
import { BookingService } from '@/services/bookingService';

type EditReservationParams = {
  reservationId?: string;
  hotelId?: string;
  hotelName?: string;
  habitacionId?: string;
  roomType?: string;
  roomCapacity?: string;
  roomBeds?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  children?: string;
  nights?: string;
  total?: string;
  pricePerNight?: string;
};

interface RoomOption {
  id: string;
  type: string;
  capacity: number;
  beds: number;
  pricePerNight: number;
}

export default function EditReservationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<EditReservationParams>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Original values
  const [originalCheckIn, setOriginalCheckIn] = useState<Date>(new Date());
  const [originalCheckOut, setOriginalCheckOut] = useState<Date>(new Date());
  const [originalNroPersonas, setOriginalNroPersonas] = useState(2);
  const [originalRoomType, setOriginalRoomType] = useState('');
  const [originalTotal, setOriginalTotal] = useState(0);

  // Editable values
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Room options from hotel search API
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const TAX_RATE = 0.15;

  const isInitialMount = useRef(true);

  useEffect(() => {
    loadReservationData();
  }, [params.reservationId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchAvailableRooms(checkInDate, checkOutDate, adults + children);
  }, [checkInDate, checkOutDate, adults, children]);

  const loadReservationData = async () => {
    try {
      setLoading(true);

      // Parse params
      const checkIn = params.checkIn ? new Date(params.checkIn + 'T00:00:00') : new Date();
      const checkOut = params.checkOut ? new Date(params.checkOut + 'T00:00:00') : new Date();
      const nroPersonas = parseInt(params.guests || '2', 10);
      const total = parseFloat(params.total || '0');
      const nights = parseInt(params.nights || '1', 10);
      const pricePerNight = nights > 0 ? (total / nights) * 0.87 : 140; // Approximate room rate

      setOriginalCheckIn(checkIn);
      setOriginalCheckOut(checkOut);
      setOriginalNroPersonas(nroPersonas);
      setOriginalRoomType(params.roomType || '');
      setOriginalTotal(total);

      setCheckInDate(checkIn);
      setCheckOutDate(checkOut);
      setAdults(nroPersonas);
      setChildren(0);

      // Set current room as initial selection
      setSelectedRoomId(params.habitacionId || '');

      // Fetch available rooms from hotel search API
      await fetchAvailableRooms(checkIn, checkOut, nroPersonas);
    } catch (error) {
      console.error('Load reservation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (checkIn: Date, checkOut: Date, guests: number) => {
    try {
      setLoadingRooms(true);

      const formatDateForApi = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      // Use hotel name or location as search term
      const searchTerm = params.hotelName || params.location || '';

      const result = await HotelService.searchAvailableHotels({
        busqueda: searchTerm,
        fecha_ingreso: formatDateForApi(checkIn),
        fecha_salida: formatDateForApi(checkOut),
        nro_personas: guests,
      });

      if (result.success && result.data) {
        // Find the current hotel in results
        const currentHotel = result.data.find(
          (hotel) => hotel.hotel_id === params.hotelId || hotel.nombre === params.hotelName
        );

        if (currentHotel && currentHotel.habitaciones) {
          const rooms: RoomOption[] = currentHotel.habitaciones.map((hab: Habitacion & { precio_promedio_noche?: number }) => ({
            id: hab.habitacion_id,
            type: hab.tipo,
            capacity: hab.capacidad,
            beds: hab.camas,
            pricePerNight: hab.precio_promedio_noche || 100,
          }));

          setRoomOptions(rooms);

          // If current room not in selection, select first available
          if (!rooms.find((r) => r.id === params.habitacionId) && rooms.length > 0) {
            setSelectedRoomId(rooms[0].id);
          }
        } else {
          // Fallback: create option from current room params
          setRoomOptions([
            {
              id: params.habitacionId || '1',
              type: params.roomType || 'Standard',
              capacity: parseInt(params.roomCapacity || '2', 10),
              beds: parseInt(params.roomBeds || '1', 10),
              pricePerNight: 100,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Fetch rooms error:', error);
      // Fallback to current room
      setRoomOptions([
        {
          id: params.habitacionId || '1',
          type: params.roomType || 'Standard',
          capacity: parseInt(params.roomCapacity || '2', 10),
          beds: parseInt(params.roomBeds || '1', 10),
          pricePerNight: 100,
        },
      ]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const formatDate = (date: Date): string => {
    const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-ES';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateShort = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const calculateNights = useCallback((): number => {
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  }, [checkInDate, checkOutDate]);

  const getSelectedRoom = (): RoomOption | undefined => {
    return roomOptions.find((room) => room.id === selectedRoomId);
  };

  const calculateNewTotal = useCallback((): number => {
    const room = getSelectedRoom();
    if (!room) return 0;
    const nights = calculateNights();
    const subtotal = room.pricePerNight * nights;
    const taxes = subtotal * TAX_RATE;
    return Math.round((subtotal + taxes) * 100) / 100;
  }, [selectedRoomId, roomOptions, calculateNights]);

  const getPriceDifference = (): number => {
    return Math.round((calculateNewTotal() - originalTotal) * 100) / 100;
  };

  const handleBack = () => {
    router.back();
  };

  const handleMenu = () => {
    // Menu action placeholder
  };

  const adjustDate = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const incrementCheckIn = () => {
    const newCheckIn = adjustDate(checkInDate, 1);
    if (newCheckIn < checkOutDate) {
      setCheckInDate(newCheckIn);
    }
  };

  const decrementCheckIn = () => {
    const newCheckIn = adjustDate(checkInDate, -1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newCheckIn >= today) {
      setCheckInDate(newCheckIn);
    }
  };

  const incrementCheckOut = () => {
    setCheckOutDate(adjustDate(checkOutDate, 1));
  };

  const decrementCheckOut = () => {
    const newCheckOut = adjustDate(checkOutDate, -1);
    if (newCheckOut > checkInDate) {
      setCheckOutDate(newCheckOut);
    }
  };

  const incrementAdults = () => setAdults((prev) => Math.min(prev + 1, 10));
  const decrementAdults = () => setAdults((prev) => Math.max(prev - 1, 1));
  const incrementChildren = () => setChildren((prev) => Math.min(prev + 1, 6));
  const decrementChildren = () => setChildren((prev) => Math.max(prev - 1, 0));
  const incrementInfants = () => setInfants((prev) => Math.min(prev + 1, 4));
  const decrementInfants = () => setInfants((prev) => Math.max(prev - 1, 0));

  const hasChanges = (): boolean => {
    return (
      checkInDate.getTime() !== originalCheckIn.getTime() ||
      checkOutDate.getTime() !== originalCheckOut.getTime() ||
      (adults + children + infants) !== originalNroPersonas ||
      infants !== 0 ||
      selectedRoomId !== (params.habitacionId || roomOptions[0]?.id)
    );
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSaveChanges = async () => {
    if (!hasChanges()) {
      Alert.alert('', t('editReservation.noChanges'));
      return;
    }

    if (!params.reservationId) {
      Alert.alert('Error', t('editReservation.errorSaving'));
      return;
    }

    const priceDiff = getPriceDifference();
    console.log('priceDiff:', priceDiff, 'originalTotal:', originalTotal, 'newTotal:', calculateNewTotal());

    // If modification results in a lower price (negative difference), redirect to payment module
    if (priceDiff > 0) {
      try {
        setSaving(true);

        // Fetch estados and update reservation status to "Pendiente"
        const estadosResult = await BookingService.getEstados();
        if (estadosResult.success && estadosResult.data) {
          const pendienteEstado = estadosResult.data.find(
            (estado) => estado.nombre.toLowerCase() === 'pendiente'
          );

          if (pendienteEstado) {
            await BookingService.updateReserva(params.reservationId!, {
              id_estado: pendienteEstado.id,
            });
          }
        }

        const selectedRoom = getSelectedRoom();
        const nights = calculateNights();
        const newTotal = calculateNewTotal();
        const subtotal = (selectedRoom?.pricePerNight || 0) * nights;
        const taxesAmount = subtotal * TAX_RATE;

        router.push({
          pathname: '/screens/payment',
          params: {
            hotelData: JSON.stringify({
              id: params.hotelId,
              name: params.hotelName,
              location: params.location,
            }),
            roomData: JSON.stringify({
              id: selectedRoomId,
              type: selectedRoom?.type || params.roomType,
              capacity: selectedRoom?.capacity || params.roomCapacity,
              beds: selectedRoom?.beds || params.roomBeds,
              pricePerNight: selectedRoom?.pricePerNight || 0,
            }),
            checkIn: checkInDate.toISOString().split('T')[0],
            checkOut: checkOutDate.toISOString().split('T')[0],
            guests: String(adults + children + infants),
            grandTotal: String(Math.abs(priceDiff)),
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            holdId: params.reservationId,
            taxRate: String(TAX_RATE),
            taxesAmount: String(Math.round(taxesAmount * 100) / 100),
            isModification: 'true',
            originalTotal: String(originalTotal),
            newTotal: String(newTotal),
          },
        });
      } catch (error) {
        console.error('Error updating reservation status:', error);
        Alert.alert('Error', t('editReservation.errorSaving'));
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      setSaving(true);

      const formatDateForApi = (date: Date): string => {
        return date.toISOString().split('T')[0];
      };

      const updatePayload: {
        fecha_ingreso?: string;
        fecha_salida?: string;
        nro_personas?: number;
        id_habitacion?: string;
        total?: number;
      } = {};

      // Add changed fields to payload
      if (checkInDate.getTime() !== originalCheckIn.getTime()) {
        updatePayload.fecha_ingreso = formatDateForApi(checkInDate);
      }

      if (checkOutDate.getTime() !== originalCheckOut.getTime()) {
        updatePayload.fecha_salida = formatDateForApi(checkOutDate);
      }

      const totalGuests = adults + children + infants;
      if (totalGuests !== originalNroPersonas) {
        updatePayload.nro_personas = totalGuests;
      }

      if (selectedRoomId !== params.habitacionId) {
        updatePayload.id_habitacion = selectedRoomId;
      }

      // Always update total if there are changes
      const newTotal = calculateNewTotal();
      updatePayload.total = Math.round(newTotal * 100) / 100;

      const result = await BookingService.updateReserva(params.reservationId, updatePayload);

      if (result.success) {
        Alert.alert(t('editReservation.successTitle'), t('editReservation.successMessage'), [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error?.message || t('editReservation.errorSaving'));
      }
    } catch (error) {
      console.error('Save changes error:', error);
      Alert.alert('Error', t('editReservation.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const nights = calculateNights();
  const selectedRoom = getSelectedRoom();
  const newTotal = calculateNewTotal();
  const priceDifference = getPriceDifference();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>{t('editReservation.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editReservation.title')}</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Reservation Card */}
        <View style={styles.card}>
          <View style={styles.currentReservationBadge}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.currentReservationText}>
              {t('editReservation.currentReservation')}
            </Text>
          </View>

          <Text style={styles.hotelName}>{params.hotelName || 'Hotel'}</Text>

          <View style={styles.reservationDetailsRow}>
            <View style={styles.reservationDetailItem}>
              <Text style={styles.detailLabel}>{t('editReservation.checkIn')}</Text>
              <Text style={styles.detailValue}>{formatDate(originalCheckIn)}</Text>
            </View>
            <View style={styles.reservationDetailItem}>
              <Text style={styles.detailLabel}>{t('editReservation.checkOut')}</Text>
              <Text style={styles.detailValue}>{formatDate(originalCheckOut)}</Text>
            </View>
          </View>

          <View style={styles.reservationDetailsRow}>
            <View style={styles.reservationDetailItem}>
              <Text style={styles.detailLabel}>{t('editReservation.guests')}</Text>
              <Text style={styles.detailValue}>
                {originalNroPersonas} {originalNroPersonas === 1 ? t('editReservation.guest') : t('editReservation.guests')}
              </Text>
            </View>
            <View style={styles.reservationDetailItem}>
              <Text style={styles.detailLabel}>{t('editReservation.roomType')}</Text>
              <Text style={styles.detailValue}>{originalRoomType || 'Standard'}</Text>
            </View>
          </View>
        </View>

        {/* Change Dates Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('editReservation.changeDates')}</Text>

          <View style={styles.datePickersRow}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>{t('editReservation.checkIn')}</Text>
              <View style={styles.datePickerButton}>
                <TouchableOpacity onPress={decrementCheckIn} style={styles.dateArrowButton}>
                  <Ionicons name="chevron-back" size={18} color="#64748B" />
                </TouchableOpacity>
                <View style={styles.dateValueContainer}>
                  <Text style={styles.datePickerValue}>{formatDateShort(checkInDate)}</Text>
                  <Ionicons name="calendar" size={18} color="#3B82F6" />
                </View>
                <TouchableOpacity onPress={incrementCheckIn} style={styles.dateArrowButton}>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>{t('editReservation.checkOut')}</Text>
              <View style={styles.datePickerButton}>
                <TouchableOpacity onPress={decrementCheckOut} style={styles.dateArrowButton}>
                  <Ionicons name="chevron-back" size={18} color="#64748B" />
                </TouchableOpacity>
                <View style={styles.dateValueContainer}>
                  <Text style={styles.datePickerValue}>{formatDateShort(checkOutDate)}</Text>
                  <Ionicons name="calendar" size={18} color="#3B82F6" />
                </View>
                <TouchableOpacity onPress={incrementCheckOut} style={styles.dateArrowButton}>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.nightsInfoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <View style={styles.nightsInfoContent}>
              <Text style={styles.nightsInfoTitle}>
                {nights} {nights === 1 ? t('editReservation.nightSelected') : t('editReservation.nightsSelected')}
              </Text>
              <Text style={styles.nightsInfoSubtitle}>
                {t('editReservation.availabilityNote')}
              </Text>
            </View>
          </View>
        </View>

        {/* Change Guests Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('editReservation.changeGuests')}</Text>

          {/* Adults */}
          <View style={styles.guestRow}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>{t('editReservation.adults')}</Text>
              <Text style={styles.guestAge}>{t('editReservation.adultsAge')}</Text>
            </View>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
                onPress={decrementAdults}
                disabled={adults <= 1}
              >
                <Ionicons name="remove" size={20} color={adults <= 1 ? '#CBD5E1' : '#1E293B'} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{adults}</Text>
              <TouchableOpacity style={styles.counterButton} onPress={incrementAdults}>
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Children */}
          <View style={styles.guestRow}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>{t('editReservation.children')}</Text>
              <Text style={styles.guestAge}>{t('editReservation.childrenAge')}</Text>
            </View>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                onPress={decrementChildren}
                disabled={children <= 0}
              >
                <Ionicons name="remove" size={20} color={children <= 0 ? '#CBD5E1' : '#1E293B'} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{children}</Text>
              <TouchableOpacity style={styles.counterButton} onPress={incrementChildren}>
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Infants */}
          <View style={[styles.guestRow, styles.guestRowLast]}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>{t('editReservation.infants')}</Text>
              <Text style={styles.guestAge}>{t('editReservation.infantsAge')}</Text>
            </View>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={[styles.counterButton, infants <= 0 && styles.counterButtonDisabled]}
                onPress={decrementInfants}
                disabled={infants <= 0}
              >
                <Ionicons name="remove" size={20} color={infants <= 0 ? '#CBD5E1' : '#1E293B'} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{infants}</Text>
              <TouchableOpacity style={styles.counterButton} onPress={incrementInfants}>
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Change Room Type Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('editReservation.changeRoomType')}</Text>

          {roomOptions.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomOption,
                selectedRoomId === room.id && styles.roomOptionSelected,
              ]}
              onPress={() => setSelectedRoomId(room.id)}
            >
              <View style={styles.roomOptionContent}>
                <Text style={styles.roomOptionType}>{room.type}</Text>
                <Text style={styles.roomOptionDescription}>{room.capacity} {t('editReservation.guests')} • {room.beds} {room.beds === 1 ? 'bed' : 'beds'}</Text>
                <Text style={styles.roomOptionPrice}>
                  ${room.pricePerNight}{t('editReservation.perNight')}
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedRoomId === room.id && styles.radioButtonSelected,
                ]}
              >
                {selectedRoomId === room.id && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Updated Pricing Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('editReservation.updatedPricing')}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {nights} {nights === 1 ? 'night' : 'nights'} × ${selectedRoom?.pricePerNight || 0}
            </Text>
            <Text style={styles.priceValue}>
              ${((selectedRoom?.pricePerNight || 0) * nights).toFixed(0)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('editReservation.taxesAndFees')}</Text>
            <Text style={styles.priceValue}>
              ${Math.round((selectedRoom?.pricePerNight || 0) * nights * TAX_RATE)}
            </Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('editReservation.total')}</Text>
            <Text style={styles.totalValue}>${newTotal.toFixed(0)}USD</Text>
          </View>

          {priceDifference !== 0 && (
            <View
              style={[
                styles.priceDifferenceBox,
                priceDifference > 0 ? styles.priceDifferencePositive : styles.priceDifferenceNegative,
              ]}
            >
              <Ionicons
                name="warning"
                size={18}
                color={priceDifference > 0 ? '#D97706' : '#16A34A'}
              />
              <View style={styles.priceDifferenceContent}>
                <Text
                  style={[
                    styles.priceDifferenceTitle,
                    priceDifference > 0 ? styles.priceDifferenceTitlePositive : styles.priceDifferenceTitleNegative,
                  ]}
                >
                  {t('editReservation.priceDifference')} {priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(0)} USD
                </Text>
                <Text style={styles.priceDifferenceSubtitle}>
                  {priceDifference > 0
                    ? t('editReservation.additionalCharges')
                    : t('editReservation.refundNote')}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>{t('editReservation.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>{t('editReservation.saveChanges')}</Text>
          )}
        </TouchableOpacity>
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
  currentReservationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  currentReservationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  hotelName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  reservationDetailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reservationDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  datePickerContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  datePickerValue: {
    fontSize: 15,
    color: '#1E293B',
  },
  dateArrowButton: {
    padding: 4,
  },
  dateValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nightsInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  nightsInfoContent: {
    flex: 1,
  },
  nightsInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  nightsInfoSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guestRowLast: {
    borderBottomWidth: 0,
  },
  guestInfo: {
    flex: 1,
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  guestAge: {
    fontSize: 13,
    color: '#94A3B8',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F8FAFC',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    width: 24,
    textAlign: 'center',
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 12,
  },
  roomOptionSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  roomOptionContent: {
    flex: 1,
  },
  roomOptionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  roomOptionDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  roomOptionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
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
    color: '#1E293B',
  },
  priceDifferenceBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  priceDifferencePositive: {
    backgroundColor: '#FFFBEB',
  },
  priceDifferenceNegative: {
    backgroundColor: '#F0FDF4',
  },
  priceDifferenceContent: {
    flex: 1,
  },
  priceDifferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceDifferenceTitlePositive: {
    color: '#D97706',
  },
  priceDifferenceTitleNegative: {
    color: '#16A34A',
  },
  priceDifferenceSubtitle: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
