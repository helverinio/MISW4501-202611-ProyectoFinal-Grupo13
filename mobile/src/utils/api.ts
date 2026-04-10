import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Backend URL configuration
let backendUrl = '';
const callerId = Constants.expoConfig?.extra?.REACT_APP_CALLER_ID || '';

// Check environment - React Native uses different env variables than React web
if (__DEV__) {
  backendUrl = 'https://d1r8df79ch2otn.cloudfront.net'; // For Android emulator (nginx gateway)
} else {
  // Production environment
  backendUrl =
    Constants.expoConfig?.extra?.REACT_APP_BACKEND_URL ||
    'https://d1r8df79ch2otn.cloudfront.net';
}

console.log('API configured with backend URL:', backendUrl);

const customAxios = axios.create({
  baseURL: backendUrl,
});

axiosRetry(customAxios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
  retryCondition: (error: AxiosError): boolean => {
    // Retry on network errors only - 401 is handled by the response interceptor
    return error.code === 'ECONNABORTED' || !error.response;
  },
});

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

customAxios.interceptors.request.use(
  async (req: InternalAxiosRequestConfig) => {
    try {
      const currentToken = await AsyncStorage.getItem('_x');

      if (currentToken) {
        const token = JSON.parse(currentToken);
        req.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      req.headers.CallerId = callerId;

      // Log the full URL being called
      const method = req.method?.toUpperCase() || 'UNKNOWN';
      const url = `${req.baseURL}${req.url}`;
      console.log(`🌐 API Request: ${method} ${url}`);
      if (req.data) {
        console.log('📤 Request Body:', JSON.stringify(req.data, null, 2));
      }
      if (req.params) {
        console.log('📋 Query Params:', JSON.stringify(req.params, null, 2));
      }
    } catch (error) {
      console.error('Error setting auth headers:', error);
    }

    return req;
  },
  err => {
    return Promise.reject(err);
  },
);

// Response interceptor
customAxios.interceptors.response.use(
  res => {
    // Log successful responses
    console.log(
      `✅ API Response: ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`,
    );
    if (res.data) {
      console.log('📥 Response Data:', JSON.stringify(res.data, null, 2));
    }

    if (res.status === 201) {
      // Handle 201 status if needed
    }
    return res;
  },
  async (err: AxiosError) => {
    const responseStatus = err.response?.status;
    const requestUrl = err.config?.url || 'unknown URL';
    const requestMethod = err.config?.method?.toUpperCase() || 'UNKNOWN';

    // Check for network connectivity errors
    if (!err.response) {
      console.error(`❌ Network Error: ${requestMethod} ${requestUrl}`, err.message);

      // Create a standardized error object for network issues
      const networkError = {
        ...err,
        isNetworkError: true,
        message: 'Unable to connect to the server. Please check your internet connection.',
      };

      return Promise.reject(networkError);
    }

    // Log error responses
    console.error(
      `❌ API Error: ${responseStatus} ${requestMethod} ${requestUrl}`,
    );
    if (err.response?.data) {
      console.error('📥 Error Response:', JSON.stringify(err.response.data, null, 2));
    }
    if (err.config?.data) {
      console.error('📤 Request Body was:', err.config.data);
    }

    if (responseStatus === 401 && err.config) {
      const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      // Prevent infinite retry loop
      if (originalRequest._retry) {
        console.log('🔄 Already retried this request, not retrying again');
        return Promise.reject(err);
      }

      // Check if we have a refresh token before attempting refresh
      const storedRefreshToken = await AsyncStorage.getItem('_c');
      if (!storedRefreshToken) {
        console.log('🔄 No refresh token available, cannot refresh');
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        console.log('🔄 Token refresh already in progress, waiting...');
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(customAxios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting token refresh...');
        const success = await refreshToken();
        
        if (success) {
          const newToken = await AsyncStorage.getItem('_x');
          if (newToken) {
            const token = JSON.parse(newToken);
            onTokenRefreshed(token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            console.log('🔄 Retrying request after token refresh');
            return customAxios(originalRequest);
          }
        }
        
        console.log('🔄 Token refresh failed');
        return Promise.reject(err);
      } catch (error) {
        console.error('Error in refresh token flow:', error);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

// Refresh token function - updated to match web app's token keys
const refreshToken = async () => {
  try {
    // Get refresh token from storage - using '_c' key as in the web app
    const refreshToken = await AsyncStorage.getItem('_c');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshUrl = `${backendUrl}/UserAuth/api/v1/RefreshToken`;
    console.log('🔑 Calling refresh token endpoint:', refreshUrl);

    // Call your refresh token endpoint
    const response = await axios.post(
      refreshUrl,
      { refreshToken: JSON.parse(refreshToken) },
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (response.data && response.data.token) {
      console.log('🔑 Token refresh successful');
      // Save new tokens using the same keys as the web app
      await AsyncStorage.setItem('_x', JSON.stringify(response.data.token));

      if (response.data.refreshToken) {
        await AsyncStorage.setItem('_c', JSON.stringify(response.data.refreshToken));
      }

      return true;
    }

    console.warn('🔑 Token refresh response missing token data');
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Clear tokens on refresh failure
    await AsyncStorage.removeItem('_x');
    await AsyncStorage.removeItem('_c');
    return false;
  }
};

export default customAxios;
