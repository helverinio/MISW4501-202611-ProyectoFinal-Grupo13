// Mock dependencies before imports
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
}));

const mockIsDevice = { value: true };
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice.value;
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('@/utils/api');

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import customAxios from '@/utils/api';
import {
  registerForPushNotificationsAsync,
  registerDeviceTokenWithBackend,
  unregisterDeviceTokenFromBackend,
} from '../pushNotificationService';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockAxios = customAxios as jest.Mocked<typeof customAxios>;

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mockIsDevice to default
    mockIsDevice.value = true;

    // Reset Constants.expoConfig to default
    (Constants as any).expoConfig = {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    };

    // Reset Platform.OS to default
    (Platform as any).OS = 'ios';

    // Set default mock for getPermissionsAsync
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      granted: true,
      canAskAgain: false,
      expires: 'never',
    });
  });

  describe('registerForPushNotificationsAsync', () => {
    it('should return null if not running on a physical device', async () => {
      mockIsDevice.value = false;
      mockNotifications.getPermissionsAsync.mockClear();

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
      expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();

      // Reset to default
      mockIsDevice.value = true;
    });

    it('should return null if permission is not granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return null if permission request fails', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as any,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
    });

    it('should create notification channel on Android', async () => {
      (Platform as any).OS = 'android';
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      await registerForPushNotificationsAsync();

      expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'default',
        {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        }
      );
    });

    it('should not create notification channel on iOS', async () => {
      (Platform as any).OS = 'ios';
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      await registerForPushNotificationsAsync();

      expect(mockNotifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('should return Expo push token on success', async () => {
      const mockToken = 'ExponentPushToken[abc123]';
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: mockToken,
      } as any);

      const result = await registerForPushNotificationsAsync();

      expect(result).toBe(mockToken);
      expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
    });

    it('should handle missing projectId in expoConfig', async () => {
      (Constants as any).expoConfig = {
        extra: {},
      };
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      const result = await registerForPushNotificationsAsync();

      expect(result).toBe('test-token');
      expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: undefined,
      });
    });

    it('should handle missing expoConfig entirely', async () => {
      (Constants as any).expoConfig = undefined;
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      const result = await registerForPushNotificationsAsync();

      expect(result).toBe('test-token');
    });

    it('should return null when getExpoPushTokenAsync throws error', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(
        new Error('Network error')
      );

      const result = await registerForPushNotificationsAsync();

      expect(result).toBeNull();
    });

    it('should not request permissions if already granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      await registerForPushNotificationsAsync();

      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permissions if not already granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as any,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      });
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'test-token',
      } as any);

      await registerForPushNotificationsAsync();

      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should log appropriate messages during registration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockIsDevice.value = false;

      await registerForPushNotificationsAsync();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Starting registration... isDevice:',
        false
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PUSH] Push notifications require a physical device'
      );

      // Reset to default
      mockIsDevice.value = true;
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('registerDeviceTokenWithBackend', () => {
    const mockUserId = 'user-123';
    const mockToken = 'expo-push-token-abc';

    it('should register device token with backend successfully', async () => {
      mockAxios.post.mockResolvedValue({
        data: { success: true },
      });

      const result = await registerDeviceTokenWithBackend(
        mockUserId,
        mockToken
      );

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/device-tokens', {
        user_id: mockUserId,
        token: mockToken,
        platform: 'expo',
      });
    });

    it('should use default platform "expo" if not specified', async () => {
      mockAxios.post.mockResolvedValue({
        data: { success: true },
      });

      await registerDeviceTokenWithBackend(mockUserId, mockToken);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/device-tokens', {
        user_id: mockUserId,
        token: mockToken,
        platform: 'expo',
      });
    });

    it('should use custom platform if specified', async () => {
      mockAxios.post.mockResolvedValue({
        data: { success: true },
      });

      await registerDeviceTokenWithBackend(mockUserId, mockToken, 'android');

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/device-tokens', {
        user_id: mockUserId,
        token: mockToken,
        platform: 'android',
      });
    });

    it('should return false when API request fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await registerDeviceTokenWithBackend(
        mockUserId,
        mockToken
      );

      expect(result).toBe(false);
    });

    it('should log success message on successful registration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse = { success: true, message: 'Token registered' };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      await registerDeviceTokenWithBackend(mockUserId, mockToken);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Device token registered with backend:',
        mockResponse
      );

      consoleSpy.mockRestore();
    });

    it('should log error message on failed registration', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('API Error');
      mockAxios.post.mockRejectedValue(mockError);

      await registerDeviceTokenWithBackend(mockUserId, mockToken);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Failed to register device token with backend:',
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('unregisterDeviceTokenFromBackend', () => {
    const mockToken = 'expo-push-token-abc';

    it('should unregister device token from backend successfully', async () => {
      mockAxios.delete.mockResolvedValue({});

      const result = await unregisterDeviceTokenFromBackend(mockToken);

      expect(result).toBe(true);
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/v1/device-tokens', {
        data: { token: mockToken },
      });
    });

    it('should return false when API request fails', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Network error'));

      const result = await unregisterDeviceTokenFromBackend(mockToken);

      expect(result).toBe(false);
    });

    it('should log success message on successful unregistration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAxios.delete.mockResolvedValue({});

      await unregisterDeviceTokenFromBackend(mockToken);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Device token unregistered from backend'
      );

      consoleSpy.mockRestore();
    });

    it('should log error message on failed unregistration', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('API Error');
      mockAxios.delete.mockRejectedValue(mockError);

      await unregisterDeviceTokenFromBackend(mockToken);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PUSH] Failed to unregister device token:',
        mockError
      );

      consoleSpy.mockRestore();
    });
  });
});
