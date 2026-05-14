import { renderHook, waitFor, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../usePushNotifications';
import { useUserStore } from '@/store/userStore';
import {
  registerForPushNotificationsAsync,
  registerDeviceTokenWithBackend,
  unregisterDeviceTokenFromBackend,
} from '@/services/pushNotificationService/pushNotificationService';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock push notification service
jest.mock('@/services/pushNotificationService/pushNotificationService', () => ({
  registerForPushNotificationsAsync: jest.fn(),
  registerDeviceTokenWithBackend: jest.fn(),
  unregisterDeviceTokenFromBackend: jest.fn(),
}));

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset user store
    useUserStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });

    // Mock notification subscriptions
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });
  });

  describe('initial state', () => {
    it('should return null expoPushToken initially', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.expoPushToken).toBeNull();
    });

    it('should return null notification initially', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.notification).toBeNull();
    });

    it('should provide unregisterPushNotifications function', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(typeof result.current.unregisterPushNotifications).toBe('function');
    });
  });

  describe('notification listeners', () => {
    it('should set up notification listeners on mount', () => {
      renderHook(() => usePushNotifications());
      
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should remove notification listeners on unmount', () => {
      const { unmount } = renderHook(() => usePushNotifications());
      
      const mockSubscription = { remove: jest.fn() };
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(mockSubscription);
      
      unmount();
      
      expect(Notifications.removeNotificationSubscription).toHaveBeenCalledTimes(2);
    });

    it('should set notification when received in foreground', () => {
      const { result } = renderHook(() => usePushNotifications());
      
      const mockNotification = {
        request: {
          content: {
            title: 'Test Notification',
            body: 'Test body',
          },
        },
      };
      
      // Get the listener callback
      const listenerCallback = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      act(() => {
        listenerCallback(mockNotification);
      });
      
      expect(result.current.notification).toEqual(mockNotification);
    });

    it('should handle notification tap', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderHook(() => usePushNotifications());
      
      // Clear previous calls
      consoleSpy.mockClear();
      
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: { type: 'payment_status_updated' },
            },
          },
        },
      };
      
      const responseCallback = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseCallback(mockResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Handling notification tap, type:',
        'payment_status_updated'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('push notification initialization', () => {
    it('should initialize push notifications when user is available', async () => {
      const mockToken = 'expo-push-token-123';
      const mockUser = { id: 'user-123', nombre: 'Test User', email: 'test@example.com', usuario: 'testuser' };
      
      (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);
      (registerDeviceTokenWithBackend as jest.Mock).mockResolvedValue(true);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const { result } = renderHook(() => usePushNotifications());
      
      // Set user after hook is mounted
      await act(async () => {
        useUserStore.setState({ user: mockUser });
      });
      
      await waitFor(() => {
        expect(registerForPushNotificationsAsync).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(result.current.expoPushToken).toBe(mockToken);
      });
    });

    it('should not initialize push notifications when user is null', () => {
      (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue('token-123');
      
      renderHook(() => usePushNotifications());
      
      expect(registerForPushNotificationsAsync).not.toHaveBeenCalled();
    });

    it('should skip backend registration if token already saved', async () => {
      const mockToken = 'expo-push-token-123';
      const mockUser = { id: 'user-123', nombre: 'Test User', email: 'test@example.com', usuario: 'testuser' };
      
      (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);
      
      useUserStore.setState({ user: mockUser });
      
      renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(registerForPushNotificationsAsync).toHaveBeenCalled();
      });
      
      expect(registerDeviceTokenWithBackend).not.toHaveBeenCalled();
    });

    it('should register token with backend if not previously saved', async () => {
      const mockToken = 'expo-push-token-123';
      const mockUser = { id: 'user-123', nombre: 'Test User', email: 'test@example.com', usuario: 'testuser' };
      
      (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(mockToken);
      (registerDeviceTokenWithBackend as jest.Mock).mockResolvedValue(true);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      useUserStore.setState({ user: mockUser });
      
      renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(registerDeviceTokenWithBackend).toHaveBeenCalledWith('user-123', mockToken);
      });
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('_push_token', mockToken);
    });

    it('should not set token if registration fails', async () => {
      const mockUser = { id: 'user-123', nombre: 'Test User', email: 'test@example.com', usuario: 'testuser' };
      
      (registerForPushNotificationsAsync as jest.Mock).mockResolvedValue(null);
      
      useUserStore.setState({ user: mockUser });
      
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(registerForPushNotificationsAsync).toHaveBeenCalled();
      });
      
      expect(result.current.expoPushToken).toBeNull();
      expect(registerDeviceTokenWithBackend).not.toHaveBeenCalled();
    });
  });

  describe('unregisterPushNotifications', () => {
    it('should unregister token from backend and clear storage', async () => {
      const mockToken = 'expo-push-token-123';
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);
      (unregisterDeviceTokenFromBackend as jest.Mock).mockResolvedValue(true);
      
      const { result } = renderHook(() => usePushNotifications());
      
      await result.current.unregisterPushNotifications();
      
      expect(unregisterDeviceTokenFromBackend).toHaveBeenCalledWith(mockToken);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('_push_token');
      expect(result.current.expoPushToken).toBeNull();
    });

    it('should handle case when no token is saved', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const { result } = renderHook(() => usePushNotifications());
      
      await result.current.unregisterPushNotifications();
      
      expect(unregisterDeviceTokenFromBackend).not.toHaveBeenCalled();
      expect(result.current.expoPushToken).toBeNull();
    });

    it('should clear expoPushToken state', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-123');
      (unregisterDeviceTokenFromBackend as jest.Mock).mockResolvedValue(true);
      
      const { result } = renderHook(() => usePushNotifications());
      
      await result.current.unregisterPushNotifications();
      
      expect(result.current.expoPushToken).toBeNull();
    });
  });

  describe('handleNotificationTap', () => {
    it('should log notification type when tapped', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { result } = renderHook(() => usePushNotifications());
      
      // Clear previous calls
      consoleSpy.mockClear();
      
      // Access the internal function through the hook's behavior
      const mockData = { type: 'reservation_updated', reservationId: '123' };
      
      // Simulate notification tap
      const mockResponse = {
        notification: {
          request: {
            content: { data: mockData },
          },
        },
      };
      
      const responseCallback = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseCallback(mockResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Handling notification tap, type:',
        'reservation_updated'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle notification tap without type', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderHook(() => usePushNotifications());
      
      // Clear previous calls
      consoleSpy.mockClear();
      
      const mockResponse = {
        notification: {
          request: {
            content: { data: {} },
          },
        },
      };
      
      const responseCallback = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseCallback(mockResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Handling notification tap, type:',
        undefined
      );
      
      consoleSpy.mockRestore();
    });
  });
});
