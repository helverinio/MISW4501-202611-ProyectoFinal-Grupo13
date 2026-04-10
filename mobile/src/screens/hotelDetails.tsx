import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Hotel, Habitacion } from '../services/hotelService';

const { width } = Dimensions.get('window');

interface HotelWithMinPrice extends Hotel {
  minPrice: number | null;
}

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop',
];

export default function HotelDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hotelData: HotelWithMinPrice = JSON.parse(params.hotelData as string);
  const checkIn = params.checkIn as string;
  const checkOut = params.checkOut as string;
  const guests = parseInt(params.guests as string, 10) || 1;

  const rating = (hotelData as any).rating || null;
  const reviews = (hotelData as any).reviews || null;
  const distancia = (hotelData as any).distancia || null;

  const getAmenidadesList = (amenidades: string): string[] => {
    return amenidades.split(',').map(a => a.trim()).filter(a => a.length > 0);
  };

  const amenidadesList = getAmenidadesList(hotelData.amenidades || '');

  const renderStars = (ratingValue: number | null) => {
    if (ratingValue === null) return null;
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={16} color="#FFB800" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFB800" />);
    }
    const emptyStars = 5 - Math.ceil(ratingValue);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFB800" />);
    }
    return stars;
  };

  const amenityIcons: { [key: string]: { icon: string; color: string } } = {
    wifi: { icon: 'wifi', color: '#4A7BF7' },
    pool: { icon: 'water', color: '#4A7BF7' },
    parking: { icon: 'car', color: '#666' },
    gym: { icon: 'fitness', color: '#22C55E' },
    spa: { icon: 'flower', color: '#F59E0B' },
    breakfast: { icon: 'restaurant', color: '#F59E0B' },
    restaurant: { icon: 'restaurant', color: '#F59E0B' },
    fitness: { icon: 'fitness', color: '#22C55E' },
    security: { icon: 'shield-checkmark', color: '#EF4444' },
    air: { icon: 'snow', color: '#4A7BF7' },
    valet: { icon: 'car', color: '#666' },
  };

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase();
    for (const [k, v] of Object.entries(amenityIcons)) {
      if (key.includes(k)) {
        return v;
      }
    }
    return { icon: 'checkmark-circle', color: '#4A7BF7' };
  };

  const handleSelectRoom = (room: Habitacion) => {
    // Navigate to booking or show room selection
    console.log('Selected room:', room);
  };

  const renderGalleryThumbnail = (uri: string, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={() => setCurrentImageIndex(index)}
      style={[
        styles.thumbnail,
        currentImageIndex === index && styles.thumbnailActive,
      ]}
    >
      <Image source={{ uri }} style={styles.thumbnailImage} />
    </TouchableOpacity>
  );

  const renderRoomCard = ({ item }: { item: Habitacion }) => {
    const precio = (item as any).precio || null;
    const vista = (item as any).vista || null;
    const tamano = (item as any).tamano || null;
    const roomAmenities = (item as any).amenidades || '';
    const roomAmenitiesList = roomAmenities ? roomAmenities.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0) : [];

    return (
      <View style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomType}>{item.tipo}</Text>
            <Text style={styles.roomDetails}>
              {item.capacidad} {t('hotelDetails.guests')} • {tamano ? `${tamano} m²` : ''} {vista ? `• ${vista}` : ''}
            </Text>
          </View>
          <View style={styles.roomPriceContainer}>
            {precio !== null ? (
              <>
                <Text style={styles.roomPrice}>${precio}</Text>
                <Text style={styles.roomPriceLabel}>{t('results.perNight')}</Text>
              </>
            ) : (
              <Text style={styles.noPriceText}>-</Text>
            )}
          </View>
        </View>
        {roomAmenitiesList.length > 0 && (
          <View style={styles.roomAmenities}>
            {roomAmenitiesList.slice(0, 2).map((amenity: string, index: number) => {
              const amenityInfo = getAmenityIcon(amenity);
              return (
                <View key={index} style={[styles.roomAmenityBadge, { borderColor: amenityInfo.color }]}>
                  <Text style={[styles.roomAmenityText, { color: amenityInfo.color }]}>{amenity}</Text>
                </View>
              );
            })}
          </View>
        )}
        <TouchableOpacity 
          style={styles.selectRoomButton}
          onPress={() => handleSelectRoom(item)}
        >
          <Text style={styles.selectRoomText}>{t('hotelDetails.selectRoom')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{hotelData.nombre}</Text>
          <Text style={styles.headerSubtitle}>{hotelData.ciudad}, {hotelData.pais}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <View style={styles.galleryContainer}>
          <Image
            source={{ uri: GALLERY_IMAGES[currentImageIndex] }}
            style={styles.mainImage}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {GALLERY_IMAGES.length}
            </Text>
          </View>
        </View>

        {/* Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          {GALLERY_IMAGES.map((uri, index) => renderGalleryThumbnail(uri, index))}
        </View>

        {/* Rating */}
        {rating !== null && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>{renderStars(rating)}</View>
            {reviews !== null && (
              <Text style={styles.ratingText}>
                {rating} ({reviews} {t('results.reviews')})
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>{hotelData.descripcion}</Text>
        </View>

        {/* Location Info */}
        <View style={styles.locationRow}>
          <View style={styles.locationItem}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>
              {distancia !== null ? `${distancia} km ${t('results.fromCenter')}` : hotelData.ciudad}
            </Text>
          </View>
          <View style={styles.locationItem}>
            <Ionicons name="car" size={16} color="#666" />
            <Text style={styles.locationText}>{t('hotelDetails.valetParking')}</Text>
          </View>
        </View>

        {/* Amenities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hotelDetails.amenities')}</Text>
          <View style={styles.amenitiesGrid}>
            {amenidadesList.map((amenity, index) => {
              const amenityInfo = getAmenityIcon(amenity);
              return (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name={amenityInfo.icon as any} size={20} color={amenityInfo.color} />
                  <Text style={styles.amenityLabel}>{amenity}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Available Rooms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('hotelDetails.availableRooms')}</Text>
          {hotelData.habitaciones && hotelData.habitaciones.length > 0 ? (
            hotelData.habitaciones.map((room, index) => (
              <View key={room.habitacion_id || index}>
                {renderRoomCard({ item: room })}
              </View>
            ))
          ) : (
            <Text style={styles.noRoomsText}>{t('hotelDetails.noRoomsAvailable')}</Text>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  galleryContainer: {
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: 220,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#4A7BF7',
  },
  thumbnailImage: {
    width: 60,
    height: 45,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 24,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    gap: 10,
  },
  amenityLabel: {
    fontSize: 14,
    color: '#333',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roomDetails: {
    fontSize: 13,
    color: '#666',
  },
  roomPriceContainer: {
    alignItems: 'flex-end',
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  roomPriceLabel: {
    fontSize: 12,
    color: '#999',
  },
  noPriceText: {
    fontSize: 16,
    color: '#999',
  },
  roomAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roomAmenityBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomAmenityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectRoomButton: {
    backgroundColor: '#4A7BF7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectRoomText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noRoomsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 24,
  },
});
