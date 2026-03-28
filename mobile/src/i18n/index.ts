import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const LANGUAGE_KEY = '_lang';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
};

export const languageOptions = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

// Initialize i18n synchronously with default language
i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

// Load saved language preference asynchronously
export const loadSavedLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && ['en', 'es', 'pt'].includes(stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.warn('Failed to load language preference:', error);
  }
};

export const changeLanguage = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

export const getCurrentLanguage = () => i18n.language;

export default i18n;
