import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export interface SearchParams {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
}

interface HotelSearchProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
  initialValues?: SearchParams | null;
}

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  title: string;
  minimumDate?: Date;
  selectedDate?: Date | null;
}

function CalendarPicker({ visible, onClose, onSelect, title, minimumDate, selectedDate }: CalendarPickerProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate || minimumDate || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth]);

  const isDateDisabled = (day: number) => {
    if (!minimumDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const minDate = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
    return date < minDate;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handleDayPress = (day: number) => {
    if (isDateDisabled(day)) return;
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelect(selected);
    onClose();
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const canGoPrev = () => {
    if (!minimumDate) return true;
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const minMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1);
    return prevMonth >= minMonth;
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerModal} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.pickerDone}>{t('search.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              onPress={goToPrevMonth} 
              disabled={!canGoPrev()}
              style={[styles.navButton, !canGoPrev() && styles.navButtonDisabled]}
            >
              <Ionicons name="chevron-back" size={24} color={canGoPrev() ? '#333' : '#ccc'} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.dayNamesRow}>
            {dayNames.map((name) => (
              <Text key={name} style={styles.dayName}>{name}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  day !== null && isDateSelected(day) && styles.dayCellSelected,
                ]}
                onPress={() => day !== null && handleDayPress(day)}
                disabled={day === null || isDateDisabled(day)}
              >
                {day && (
                  <Text
                    style={[
                      styles.dayText,
                      isDateDisabled(day) && styles.dayTextDisabled,
                      isDateSelected(day) && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HotelSearch({ onSearch, loading = false, initialValues }: HotelSearchProps) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [checkIn, setCheckIn] = useState<Date | null>(initialValues?.checkIn || null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialValues?.checkOut || null);
  const [guests, setGuests] = useState(initialValues?.guests || 1);

  useEffect(() => {
    if (initialValues) {
      setDestination(initialValues.destination);
      setCheckIn(initialValues.checkIn);
      setCheckOut(initialValues.checkOut);
      setGuests(initialValues.guests);
    }
  }, [initialValues]);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showGuestsPicker, setShowGuestsPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return t('search.datePlaceholder');
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleSearch = () => {
    if (!destination || !checkIn || !checkOut) {
      return;
    }
    onSearch({
      destination,
      checkIn,
      checkOut,
      guests,
    });
  };

  const handleCheckInSelect = (date: Date) => {
    setCheckIn(date);
    if (checkOut && date >= checkOut) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay);
    }
  };

  const handleCheckOutSelect = (date: Date) => {
    setCheckOut(date);
  };

  const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <View style={styles.container}>
      {/* Destination */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={22} color="#4A7BF7" />
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>{t('search.destination')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('search.destinationPlaceholder')}
              placeholderTextColor="#999"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Dates Row */}
      <View style={styles.datesRow}>
        {/* Check-in */}
        <TouchableOpacity
          style={styles.dateSection}
          onPress={() => setShowCheckInPicker(true)}
        >
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={22} color="#4A7BF7" />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>{t('search.checkIn')}</Text>
              <Text style={[styles.dateText, !checkIn && styles.placeholder]}>
                {formatDate(checkIn)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.verticalDivider} />

        {/* Check-out */}
        <TouchableOpacity
          style={styles.dateSection}
          onPress={() => setShowCheckOutPicker(true)}
        >
          <View style={styles.inputRow}>
            <Ionicons name="calendar-outline" size={22} color="#4A7BF7" />
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>{t('search.checkOut')}</Text>
              <Text style={[styles.dateText, !checkOut && styles.placeholder]}>
                {formatDate(checkOut)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Guests */}
      <TouchableOpacity
        style={styles.inputSection}
        onPress={() => setShowGuestsPicker(true)}
      >
        <View style={styles.inputRow}>
          <Ionicons name="people-outline" size={22} color="#4A7BF7" />
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>{t('search.guests')}</Text>
            <Text style={styles.dateText}>
              {guests} {guests === 1 ? t('search.adult') : t('search.adults')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Search Button */}
      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={loading}
      >
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>
          {loading ? t('search.searching') : t('search.searchHotels')}
        </Text>
      </TouchableOpacity>

      {/* Calendar Pickers */}
      <CalendarPicker
        visible={showCheckInPicker}
        onClose={() => setShowCheckInPicker(false)}
        onSelect={handleCheckInSelect}
        title={t('search.checkIn')}
        minimumDate={new Date()}
        selectedDate={checkIn}
      />

      <CalendarPicker
        visible={showCheckOutPicker}
        onClose={() => setShowCheckOutPicker(false)}
        onSelect={handleCheckOutSelect}
        title={t('search.checkOut')}
        minimumDate={checkIn || new Date()}
        selectedDate={checkOut}
      />

      {/* Guests Picker Modal */}
      <Modal transparent animationType="fade" visible={showGuestsPicker}>
        <TouchableOpacity
          style={styles.pickerModal}
          activeOpacity={1}
          onPress={() => setShowGuestsPicker(false)}
        >
          <View style={styles.guestsPickerContainer}>
            <Text style={styles.guestsPickerTitle}>{t('search.selectGuests')}</Text>
            {guestOptions.map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.guestOption,
                  guests === num && styles.guestOptionSelected,
                ]}
                onPress={() => {
                  setGuests(num);
                  setShowGuestsPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.guestOptionText,
                    guests === num && styles.guestOptionTextSelected,
                  ]}
                >
                  {num} {num === 1 ? t('search.adult') : t('search.adults')}
                </Text>
                {guests === num && (
                  <Ionicons name="checkmark" size={20} color="#4A7BF7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
  },
  inputSection: {
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContent: {
    marginLeft: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  datesRow: {
    flexDirection: 'row',
  },
  dateSection: {
    flex: 1,
    paddingVertical: 12,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  searchButton: {
    backgroundColor: '#4A7BF7',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#a0b8f7',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerDone: {
    fontSize: 16,
    color: '#4A7BF7',
    fontWeight: '600',
  },
  guestsPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  guestsPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  guestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  guestOptionSelected: {
    backgroundColor: '#F0F4FF',
  },
  guestOptionText: {
    fontSize: 16,
    color: '#333',
  },
  guestOptionTextSelected: {
    fontWeight: '600',
    color: '#4A7BF7',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayNamesRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#4A7BF7',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextDisabled: {
    color: '#ccc',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
