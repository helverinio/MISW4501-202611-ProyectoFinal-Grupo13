import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LanguageSelector from '../common/LanguageSelector';
import HotelSearch, { SearchParams } from '../common/HotelSearch';

export default function LandingPage() {
  const { t } = useTranslation();
  const [searchLoading, setSearchLoading] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('_x');
    await AsyncStorage.removeItem('_c');
    router.replace('/screens/login' as Href);
  };

  const handleSearch = async (params: SearchParams) => {
    setSearchLoading(true);
    
    const searchParams = {
      destination: params.destination,
      checkIn: params.checkIn.toISOString().split('T')[0],
      checkOut: params.checkOut.toISOString().split('T')[0],
      guests: params.guests.toString(),
    };

    router.push({
      pathname: '/screens/hotelResults',
      params: searchParams,
    } as any);
    
    setSearchLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="airplane" size={20} color="#fff" />
            </View>
            <Text style={styles.logoText}>{t('common.appName')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <LanguageSelector />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>{t('landing.findStay')}</Text>
          <Text style={styles.subtitle}>{t('landing.discoverHotels')}</Text>
        </View>

        {/* Search Component */}
        <HotelSearch onSearch={handleSearch} loading={searchLoading} />

        {/* Quick Actions or Featured - can be expanded later */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
