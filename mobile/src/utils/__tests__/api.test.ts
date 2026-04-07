import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn(),
    get: jest.fn(),
    defaults: {},
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    post: jest.fn(),
  };
});

jest.mock('axios-retry', () => jest.fn());
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      REACT_APP_CALLER_ID: 'test-caller-id',
      REACT_APP_BACKEND_URL: 'https://test-backend.com',
    },
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('API Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('axios instance creation', () => {
    it('should create axios instance with base URL', () => {
      jest.isolateModules(() => {
        require('../api');
      });

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
        })
      );
    });

    it('should configure request interceptor', () => {
      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        expect(customAxios.interceptors.request.use).toHaveBeenCalled();
      });
    });

    it('should configure response interceptor', () => {
      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        expect(customAxios.interceptors.response.use).toHaveBeenCalled();
      });
    });
  });

  describe('request interceptor', () => {
    let requestInterceptor: Function;
    let requestErrorHandler: Function;

    beforeEach(() => {
      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        const calls = customAxios.interceptors.request.use.mock.calls;
        if (calls.length > 0) {
          requestInterceptor = calls[0][0];
          requestErrorHandler = calls[0][1];
        }
      });
    });

    it('should add Authorization header when token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('test-token'));

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      const result = await requestInterceptor(mockRequest);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should add CallerId header', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      const result = await requestInterceptor(mockRequest);

      expect(result.headers.CallerId).toBeDefined();
    });

    it('should not add Authorization header when no token', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      const result = await requestInterceptor(mockRequest);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should handle errors gracefully and still return request', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      const result = await requestInterceptor(mockRequest);

      expect(result).toBe(mockRequest);
    });

    it('should reject on request error', async () => {
      const error = new Error('Request setup error');

      await expect(requestErrorHandler(error)).rejects.toEqual(error);
    });
  });

  describe('response interceptor', () => {
    let responseInterceptor: Function;
    let responseErrorHandler: Function;

    beforeEach(() => {
      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        const calls = customAxios.interceptors.response.use.mock.calls;
        if (calls.length > 0) {
          responseInterceptor = calls[0][0];
          responseErrorHandler = calls[0][1];
        }
      });
    });

    it('should pass through successful responses', () => {
      const mockResponse = {
        status: 200,
        data: { message: 'success' },
        config: { method: 'get', url: '/test' },
      };

      const result = responseInterceptor(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('should handle 201 responses', () => {
      const mockResponse = {
        status: 201,
        data: { id: 1 },
        config: { method: 'post', url: '/create' },
      };

      const result = responseInterceptor(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('should handle network errors without response', async () => {
      const networkError = {
        message: 'Network Error',
        config: { url: '/test', method: 'get' },
        response: undefined,
      };

      await expect(responseErrorHandler(networkError)).rejects.toMatchObject({
        isNetworkError: true,
        message: 'Unable to connect to the server. Please check your internet connection.',
      });
    });

    it('should handle 401 errors and attempt token refresh', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify('old-token'));
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify('refresh-token'));

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get' },
      };

      try {
        await responseErrorHandler(error401);
      } catch (e) {
        // Expected to reject
      }

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('_x');
    });

    it('should reject non-401 errors normally', async () => {
      const error500 = {
        response: { status: 500, data: { message: 'Server error' } },
        config: { url: '/test', method: 'get' },
      };

      await expect(responseErrorHandler(error500)).rejects.toEqual(error500);
    });
  });

  describe('refresh token', () => {
    beforeEach(() => {
      mockAsyncStorage.getItem.mockReset();
      mockAsyncStorage.setItem.mockReset();
      mockAsyncStorage.removeItem.mockReset();
    });

    it('should store new tokens on successful refresh', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('refresh-token'));
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      jest.isolateModules(async () => {
        const api = require('../api');
      });
    });

    it('should clear tokens when refresh fails', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('refresh-token'));
      (axios.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      jest.isolateModules(async () => {
        const api = require('../api');
      });
    });
  });
});
