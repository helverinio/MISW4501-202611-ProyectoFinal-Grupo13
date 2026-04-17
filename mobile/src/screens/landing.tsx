import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import LanguageSelector from '../common/LanguageSelector';
import HotelSearch, { SearchParams } from '../common/HotelSearch';

const LAST_SEARCH_KEY = 'lastHotelSearch';

export default function LandingPage() {
  const { t } = useTranslation();
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);

  useEffect(() => {
    loadLastSearch();
  }, []);

  const loadLastSearch = async () => {
    try {
      const stored = await AsyncStorage.getItem(LAST_SEARCH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastSearch({
          destination: parsed.destination,
          checkIn: new Date(parsed.checkIn),
          checkOut: new Date(parsed.checkOut),
          guests: parsed.guests,
        });
      }
    } catch (e) {
      // Ignore load errors
    }
  };

  const saveLastSearch = async (params: SearchParams) => {
    try {
      await AsyncStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(params));
    } catch (e) {
      // Ignore save errors
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('_x');
    await AsyncStorage.removeItem('_c');
    router.replace('/screens/login' as Href);
  };

  const handleMyReservations = () => {
    router.push('/screens/myReservations' as Href);
  };

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSearch = async (params: SearchParams) => {
    setSearchLoading(true);
    setLastSearch(params);
    saveLastSearch(params);
    
    const searchParams = {
      destination: params.destination,
      checkIn: formatLocalDate(params.checkIn),
      checkOut: formatLocalDate(params.checkOut),
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
        <HotelSearch onSearch={handleSearch} loading={searchLoading} initialValues={lastSearch} />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleMyReservations}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>{t('landing.myReservations')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

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
  quickActions: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
});
