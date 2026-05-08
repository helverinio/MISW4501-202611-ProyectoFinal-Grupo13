import '@testing-library/jest-native/extend-expect';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Href: {},
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Reset AsyncStorage between tests so offline caches don't leak across specs
beforeEach(async () => {
  try {
    const asModule = require('@react-native-async-storage/async-storage');
    const AsyncStorage = asModule.default || asModule;
    if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
      await AsyncStorage.clear();
    }
  } catch {
    // ignore if not available in this test environment
  }
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => ({
    permission: { granted: true, canAskAgain: true },
    requestPermission: jest.fn(),
  }),
}));

jest.useFakeTimers();
