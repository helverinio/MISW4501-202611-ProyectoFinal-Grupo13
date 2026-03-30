import AsyncStorage from '@react-native-async-storage/async-storage';
import hashingUtility from '../../utils/hashingUtility';
import { AuthResult } from './models/AuthResult';
import { useUserStore } from '@/store/userStore';
import customAxios from '@/utils/api';
import { GetUserByToken } from '../userService/GetUserByTokenService';

export const AuthService = {
  send: async (email: string, password: string): Promise<AuthResult> => {
    try {
      await AsyncStorage.removeItem('_x');

      const url = '/api/v1/auth/login';

      const hashedPwd = await hashingUtility(password);

      const response = await customAxios.post(url, {
        usuario: email,
        contrasena: hashedPwd,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem('_x', JSON.stringify(response.data.access_token));
        await AsyncStorage.setItem('_c', JSON.stringify(response.data.refresh_token));

        console.log('response.data.access_token', response.data.access_token);

        useUserStore.getState().setUser(response.data.usuario);

        // await AsyncStorage.setItem('_c', JSON.stringify(response.data.refreshToken));
        // await AsyncStorage.setItem('_lang', response.data.language);

        // Fetch user data after successful authentication
        // const userResult = await GetUserByToken.send();
        // if (userResult.success && userResult.data) {
          // Update the user store with the fetched user data
          // useUserStore.getState().setUser(userResult.data.result);
        // }

        return {
          success: true,
          data: response.data,
        };
      }

      await AsyncStorage.removeItem('_x');

      return {
        success: false,
        error: {
          message: 'Authentication failed',
          status: response.status,
        },
      };
    } catch (error) {
      console.error('Authentication error:', error);
      await AsyncStorage.removeItem('_x');
      return {
        success: false,
        error: {
          message: 'Authentication error',
        },
      };
    }
  },
};

export default AuthService;
