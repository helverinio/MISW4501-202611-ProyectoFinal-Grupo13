import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import HotelService, { Hotel, Habitacion } from '../services/hotelService';

interface RoomCard {
  hotel: Hotel;
  room: Habitacion;
}

export default function HotelResultsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const destination = params.destination as string;
  const checkIn = params.checkIn as string;
  const checkOut = params.checkOut as string;
  const guests = parseInt(params.guests as string, 10) || 1;

  useEffect(() => {
    searchHotels();
  }, []);

  const searchHotels = async () => {
    setLoading(true);
    setError(null);

    const result = await HotelService.searchAvailableHotels({
      busqueda: destination,
      fecha_ingreso: checkIn,
      fecha_salida: checkOut,
      nro_personas: guests,
    });

    if (result.success && result.data) {
      // Flatten hotels into individual room cards
      const flattenedRooms: RoomCard[] = [];
      result.data.forEach(hotel => {
        hotel.habitaciones?.forEach(room => {
          flattenedRooms.push({ hotel, room });
        });
      });
      setRooms(flattenedRooms);
    } else {
      setError(result.error?.message || t('results.errorLoading'));
    }
    setLoading(false);
  };

  const formatDateRange = () => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${checkInDate.toLocaleDateString('en-US', options)} - ${checkOutDate.toLocaleDateString('en-US', options)}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={14} color="#FFB800" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFB800" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#FFB800" />);
    }
    return stars;
  };

  const renderAmenity = (amenity: string, index: number) => {
    const amenityIcons: { [key: string]: string } = {
      wifi: 'wifi',
      pool: 'water',
      parking: 'car',
      gym: 'fitness',
      spa: 'flower',
      breakfast: 'restaurant',
    };

    const amenityColors: { [key: string]: string } = {
      wifi: '#4A7BF7',
      pool: '#4A7BF7',
      parking: '#4A7BF7',
      gym: '#22C55E',
      spa: '#F59E0B',
      breakfast: '#F59E0B',
    };

    const iconName = amenityIcons[amenity.toLowerCase()] || 'checkmark-circle';
    const color = amenityColors[amenity.toLowerCase()] || '#4A7BF7';

    return (
      <View key={index} style={[styles.amenityBadge, { borderColor: color }]}>
        <Ionicons name={iconName as any} size={12} color={color} />
        <Text style={[styles.amenityText, { color }]}>{amenity}</Text>
      </View>
    );
  };

  const getAmenidadesList = (amenidades: string): string[] => {
    return amenidades.split(',').map(a => a.trim()).filter(a => a.length > 0);
  };

  const renderRoomCard = ({ item }: { item: RoomCard }) => {
    const { hotel, room } = item;
    const amenidadesList = getAmenidadesList(hotel.amenidades || '');

    return (
      <View style={styles.hotelCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
          }}
          style={styles.hotelImage}
        />
        <View style={styles.hotelInfo}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {hotel.nombre}
          </Text>
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>{renderStars(4.5)}</View>
            <Text style={styles.ratingText}>
              4.5 (124 {t('results.reviews')})
            </Text>
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {hotel.ciudad} • 0.8 km {t('results.fromCenter')}
          </Text>
          <View style={styles.amenitiesRow}>
            {amenidadesList.slice(0, 2).map((amenity, index) => renderAmenity(amenity, index))}
          </View>
          <Text style={styles.roomTypeText} numberOfLines={1}>
            {room.tipo} • {room.capacidad} {t('results.guests')} • {room.camas} {t('results.beds')}
          </Text>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.perNightText}>{t('results.perNight')}</Text>
              <Text style={styles.priceText}>$85</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>{t('results.viewDetails')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{destination}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDateRange()} • {guests} {guests === 1 ? t('search.guest') : t('search.guests')}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={16} color="#333" />
          <Text style={styles.filterText}>{t('results.filters')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>{t('results.price')}</Text>
          <Ionicons name="chevron-down" size={14} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>{t('results.rating')}</Text>
          <Ionicons name="chevron-down" size={14} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      {!loading && !error && (
        <Text style={styles.resultsCount}>
          <Text style={styles.resultsCountBold}>{rooms.length} {t('results.rooms')}</Text>{' '}
          {t('results.foundIn')} {destination}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4A7BF7" />
          <Text style={styles.loadingText}>{t('results.searching')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#999" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={searchHotels}>
            <Text style={styles.retryText}>{t('results.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="bed-outline" size={48} color="#999" />
          <Text style={styles.noResultsText}>{t('results.noHotels')}</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => `${item.hotel.hotel_id}-${item.room.habitacion_id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },
  resultsCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#666',
  },
  resultsCountBold: {
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  hotelImage: {
    width: 120,
    height: '100%',
    minHeight: 160,
  },
  hotelInfo: {
    flex: 1,
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    lineHeight: 16,
  },
  roomTypeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  perNightText: {
    fontSize: 11,
    color: '#999',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  viewDetailsButton: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
