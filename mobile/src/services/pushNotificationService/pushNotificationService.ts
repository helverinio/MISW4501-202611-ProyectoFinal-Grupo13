import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import customAxios from '@/utils/api';

// Configure how notifications are presented when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications and returns the Expo push token.
 * On Android, also creates a default notification channel.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[PUSH] Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PUSH] Permission not granted for push notifications');
    return null;
  }

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Get the FCM token via Expo's push notification token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.log('[PUSH] Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[PUSH] Error getting push token:', error);
    return null;
  }
}

/**
 * Register the device token with the backend so the server can send push notifications.
 */
export async function registerDeviceTokenWithBackend(
  userId: string,
  token: string,
  platform: string = 'expo'
): Promise<boolean> {
  try {
    const response = await customAxios.post('/api/v1/device-tokens', {
      user_id: userId,
      token,
      platform,
    });
    console.log('[PUSH] Device token registered with backend:', response.data);
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to register device token with backend:', error);
    return false;
  }
}

/**
 * Unregister the device token from the backend (e.g. on logout).
 */
export async function unregisterDeviceTokenFromBackend(token: string): Promise<boolean> {
  try {
    await customAxios.delete('/api/v1/device-tokens', {
      data: { token },
    });
    console.log('[PUSH] Device token unregistered from backend');
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to unregister device token:', error);
    return false;
  }
}
