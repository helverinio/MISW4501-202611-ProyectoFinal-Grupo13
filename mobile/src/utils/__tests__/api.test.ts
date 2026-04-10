import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockAxiosInstance: any;

jest.mock('axios', () => {
  mockAxiosInstance = {
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

    it('should not duplicate Bearer prefix when token already has it', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('Bearer existing-token'));

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      const result = await requestInterceptor(mockRequest);

      expect(result.headers.Authorization).toBe('Bearer existing-token');
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
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify('refresh-token'));

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      try {
        await responseErrorHandler(error401);
      } catch (e) {
        // Expected to reject
      }

      // The refresh flow first gets the refresh token from '_c'
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('_c');
    });

    it('should reject 401 when no refresh token available', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      await expect(responseErrorHandler(error401)).rejects.toEqual(error401);
    });

    it('should not retry 401 if already retried', async () => {
      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {}, _retry: true },
      };

      await expect(responseErrorHandler(error401)).rejects.toEqual(error401);
      // Should not attempt to get refresh token since _retry is true
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalledWith('_c');
    });

    it('should reject non-401 errors normally', async () => {
      const error500 = {
        response: { status: 500, data: { message: 'Server error' } },
        config: { url: '/test', method: 'get' },
      };

      await expect(responseErrorHandler(error500)).rejects.toEqual(error500);
    });

    it('should handle 403 forbidden errors', async () => {
      const error403 = {
        response: { status: 403, data: { message: 'Forbidden' } },
        config: { url: '/test', method: 'get' },
      };

      await expect(responseErrorHandler(error403)).rejects.toEqual(error403);
    });

    it('should handle 404 not found errors', async () => {
      const error404 = {
        response: { status: 404, data: { message: 'Not found' } },
        config: { url: '/test', method: 'get' },
      };

      await expect(responseErrorHandler(error404)).rejects.toEqual(error404);
    });
  });

  describe('refresh token', () => {
    let responseErrorHandler: Function;

    beforeEach(() => {
      mockAsyncStorage.getItem.mockReset();
      mockAsyncStorage.setItem.mockReset();
      mockAsyncStorage.removeItem.mockReset();
      (axios.post as jest.Mock).mockReset();

      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        const calls = customAxios.interceptors.response.use.mock.calls;
        if (calls.length > 0) {
          responseErrorHandler = calls[0][1];
        }
      });
    });

    it('should call refresh endpoint with correct URL and payload', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('my-refresh-token')) // for _c check
        .mockResolvedValueOnce(JSON.stringify('my-refresh-token')); // for refresh call
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      try {
        await responseErrorHandler(error401);
      } catch (e) {
        // May reject depending on flow
      }

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/UserAuth/api/v1/RefreshToken'),
        { refreshToken: 'my-refresh-token' },
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    it('should store new tokens on successful refresh', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('refresh-token')) // for _c check
        .mockResolvedValueOnce(JSON.stringify('refresh-token')) // for refresh call
        .mockResolvedValueOnce(JSON.stringify('new-access-token')); // for retry

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      try {
        await responseErrorHandler(error401);
      } catch (e) {
        // May reject
      }

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('_x', JSON.stringify('new-access-token'));
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('_c', JSON.stringify('new-refresh-token'));
    });

    it('should clear tokens when refresh fails', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('refresh-token')) // for _c check
        .mockResolvedValueOnce(JSON.stringify('refresh-token')); // for refresh call

      (axios.post as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      await expect(responseErrorHandler(error401)).rejects.toBeDefined();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('_x');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('_c');
    });

    it('should handle refresh response without new refresh token', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('refresh-token'))
        .mockResolvedValueOnce(JSON.stringify('refresh-token'))
        .mockResolvedValueOnce(JSON.stringify('new-access-token'));

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          token: 'new-access-token',
          // No refreshToken in response
        },
      });

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      try {
        await responseErrorHandler(error401);
      } catch (e) {
        // May reject
      }

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('_x', JSON.stringify('new-access-token'));
      // Should not set refresh token if not provided
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith('_c', expect.anything());
    });

    it('should fail refresh when response has no token data', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify('refresh-token'))
        .mockResolvedValueOnce(JSON.stringify('refresh-token'));

      (axios.post as jest.Mock).mockResolvedValue({
        data: {}, // No token in response
      });

      const error401 = {
        response: { status: 401, data: {} },
        config: { url: '/test', method: 'get', headers: {} },
      };

      await expect(responseErrorHandler(error401)).rejects.toBeDefined();
    });
  });

  describe('axios-retry configuration', () => {
    it('should configure axios-retry on the custom instance', () => {
      const axiosRetry = require('axios-retry');

      jest.isolateModules(() => {
        require('../api');
      });

      expect(axiosRetry).toHaveBeenCalled();
    });

    it('should configure retry condition for network errors', () => {
      const axiosRetry = require('axios-retry');

      jest.isolateModules(() => {
        require('../api');
      });

      const retryConfig = axiosRetry.mock.calls[0][1];
      const retryCondition = retryConfig.retryCondition;

      // Should retry on ECONNABORTED
      expect(retryCondition({ code: 'ECONNABORTED', response: null })).toBe(true);

      // Should retry when no response (network error)
      expect(retryCondition({ code: 'OTHER', response: undefined })).toBe(true);

      // Should NOT retry when response exists (server responded)
      expect(retryCondition({ code: 'OTHER', response: { status: 500 } })).toBe(false);
    });
  });

  describe('logging', () => {
    let consoleSpy: jest.SpyInstance;
    let requestInterceptor: Function;
    let responseInterceptor: Function;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      jest.isolateModules(() => {
        const customAxios = require('../api').default;
        const reqCalls = customAxios.interceptors.request.use.mock.calls;
        const resCalls = customAxios.interceptors.response.use.mock.calls;
        if (reqCalls.length > 0) {
          requestInterceptor = reqCalls[0][0];
        }
        if (resCalls.length > 0) {
          responseInterceptor = resCalls[0][0];
        }
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log request details', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
      };

      await requestInterceptor(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Request')
      );
    });

    it('should log request body when present', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'post',
        data: { key: 'value' },
      };

      await requestInterceptor(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request Body'),
        expect.any(String)
      );
    });

    it('should log query params when present', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        baseURL: 'http://test.com',
        url: '/api/test',
        method: 'get',
        params: { page: 1 },
      };

      await requestInterceptor(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query Params'),
        expect.any(String)
      );
    });

    it('should log successful response', () => {
      const mockResponse = {
        status: 200,
        data: { message: 'success' },
        config: { method: 'get', url: '/test' },
      };

      responseInterceptor(mockResponse);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Response')
      );
    });
  });
});
