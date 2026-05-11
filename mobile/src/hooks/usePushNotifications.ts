import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import {
  registerForPushNotificationsAsync,
  registerDeviceTokenWithBackend,
  unregisterDeviceTokenFromBackend,
} from '@/services/pushNotificationService/pushNotificationService';

const PUSH_TOKEN_STORAGE_KEY = '_push_token';

/**
 * Hook that manages push notification registration, token persistence,
 * and notification event listeners.
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    // Register for push notifications when user is available
    if (user?.id) {
      initializePushNotifications(user.id);
    }

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif) => {
        console.log('[PUSH] Notification received in foreground:', notif);
        setNotification(notif);
      }
    );

    // Listen for notification interactions (user tapped the notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[PUSH] Notification tapped:', response);
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);

  const initializePushNotifications = async (userId: string) => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      setExpoPushToken(token);

      // Check if we already registered this token
      const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (savedToken === token) {
        console.log('[PUSH] Token already registered, skipping backend registration');
        return;
      }

      // Register with backend
      const success = await registerDeviceTokenWithBackend(userId, token);
      if (success) {
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      }
    } catch (error) {
      console.error('[PUSH] Error initializing push notifications:', error);
    }
  };

  const handleNotificationTap = (data: Record<string, unknown>) => {
    // Handle navigation based on notification data
    const type = data?.type as string;
    console.log('[PUSH] Handling notification tap, type:', type);

    // Navigation can be handled here based on notification type
    // e.g., navigate to reservation detail on payment_status_updated
  };

  const unregisterPushNotifications = async () => {
    const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (savedToken) {
      await unregisterDeviceTokenFromBackend(savedToken);
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
    setExpoPushToken(null);
  };

  return {
    expoPushToken,
    notification,
    unregisterPushNotifications,
  };
}
