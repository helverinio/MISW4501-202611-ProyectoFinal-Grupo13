import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Backend URL configuration
let backendUrl = '';
const callerId = Constants.expoConfig?.extra?.REACT_APP_CALLER_ID || '';

// Check environment - React Native uses different env variables than React web
if (__DEV__) {
  backendUrl = 'http://10.0.2.2:8081'; // For Android emulator (nginx gateway)
} else {
  // Production environment
  backendUrl =
    Constants.expoConfig?.extra?.REACT_APP_BACKEND_URL ||
    'https://oa-charlottemason-prod-backend.azurewebsites.net';
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
    // Retry on 401 unauthorized (token might need refresh) or network errors
    return error.response?.status === 401 || error.code === 'ECONNABORTED' || !error.response;
  },
});

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
      err.response?.data || err.message,
    );

    if (responseStatus === 401) {
      try {
        console.log('🔄 Attempting token refresh...');
        // Get token from AsyncStorage
        const currentToken = await AsyncStorage.getItem('_x');

        if (currentToken) {
          // Call refresh token function
          await refreshToken();
          // Retry the original request
          if (err.config) {
            console.log('🔄 Retrying request after token refresh');
            return customAxios(err.config);
          }
        }
      } catch (error) {
        console.error('Error in refresh token flow:', error);
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
