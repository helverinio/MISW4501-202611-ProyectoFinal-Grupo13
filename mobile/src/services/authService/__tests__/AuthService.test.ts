import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../AuthService';
import customAxios from '@/utils/api';
import { useUserStore } from '@/store/userStore';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/utils/api');
jest.mock('@/store/userStore');

const mockAxios = customAxios as jest.Mocked<typeof customAxios>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AuthService', () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserStore.getState as jest.Mock).mockReturnValue({
      setUser: mockSetUser,
    });
  });

  describe('send', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    it('should remove existing token before login attempt', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'token', refresh_token: 'refresh', usuario: {} },
      });

      await AuthService.send(validEmail, validPassword);

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('_x');
    });

    it('should call API with correct credentials', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { access_token: 'token', refresh_token: 'refresh', usuario: {} },
      });

      await AuthService.send(validEmail, validPassword);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        usuario: validEmail,
        contrasena: validPassword,
      });
    });

    it('should store tokens on successful login (status 200)', async () => {
      const mockResponse = {
        status: 200,
        data: {
          access_token: 'access_token_123',
          refresh_token: 'refresh_token_456',
          usuario: { id: 1, name: 'Test User' },
        },
      };
      mockAxios.post.mockResolvedValue(mockResponse);

      await AuthService.send(validEmail, validPassword);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '_x',
        JSON.stringify('access_token_123')
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '_c',
        JSON.stringify('refresh_token_456')
      );
    });

    it('should update user store on successful login', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: {
          access_token: 'token',
          refresh_token: 'refresh',
          usuario: mockUser,
        },
      });

      await AuthService.send(validEmail, validPassword);

      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    });

    it('should return success result on successful login', async () => {
      const mockData = {
        access_token: 'token',
        refresh_token: 'refresh',
        usuario: { id: 1 },
      };
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: mockData,
      });

      const result = await AuthService.send(validEmail, validPassword);

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('should return failure when status is not 200', async () => {
      mockAxios.post.mockResolvedValue({
        status: 401,
        data: {},
      });

      const result = await AuthService.send(validEmail, validPassword);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Authentication failed',
          status: 401,
        },
      });
    });

    it('should remove token when login fails with non-200 status', async () => {
      mockAxios.post.mockResolvedValue({
        status: 401,
        data: {},
      });

      await AuthService.send(validEmail, validPassword);

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockAsyncStorage.removeItem).toHaveBeenLastCalledWith('_x');
    });

    it('should return error result when API throws exception', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await AuthService.send(validEmail, validPassword);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Authentication error',
        },
      });
    });

    it('should remove token when API throws exception', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      await AuthService.send(validEmail, validPassword);

      expect(mockAsyncStorage.removeItem).toHaveBeenLastCalledWith('_x');
    });

  });
});
