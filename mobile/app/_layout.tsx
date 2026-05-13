import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from '../src/i18n';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  // Initialize push notifications (registers token when user is logged in)
  usePushNotifications();

  return (
    <I18nextProvider i18n={i18n}>
      <View style={{ flex: 1 }}>
        {/* <Text style={{ backgroundColor: 'red', color: 'white', padding: 4, textAlign: 'center', fontSize: 10 }}>
          ROOT | User: {user?.id ? user.id.substring(0, 8) : 'null'}
        </Text> */}
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
      <StatusBar style="auto" />
    </I18nextProvider>
  );
}
