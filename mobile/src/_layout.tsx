import { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from './i18n';
// import { usePushNotifications } from './hooks/usePushNotifications';
import { useUserStore } from './store/userStore';

export default function RootLayout() {
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    loadSavedLanguage();
    Alert.alert('[DEBUG] RootLayout', 'Root layout mounted');
  }, []);

  useEffect(() => {
    if (user?.id) {
      Alert.alert('[DEBUG] RootLayout', `User detected: ${user.id.substring(0, 8)}...`);
    }
  }, [user?.id]);

  // Push notifications temporarily disabled for debugging
  // usePushNotifications();

  return (
    <I18nextProvider i18n={i18n}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <StatusBar style="auto" />
    </I18nextProvider>
  );
}
