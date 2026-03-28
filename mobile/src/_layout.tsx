import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n, { loadSavedLanguage } from './i18n';

export default function RootLayout() {
  useEffect(() => {
    loadSavedLanguage();
  }, []);

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
