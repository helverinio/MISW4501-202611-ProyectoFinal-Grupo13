import { GetUserByToken } from '../GetUserByTokenService';
import customAxios from '../../../utils/api';

jest.mock('../../../utils/api');

const mockAxios = customAxios as jest.Mocked<typeof customAxios>;

describe('GetUserByTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should call the correct API endpoint', async () => {
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { id: 1, name: 'Test User' },
      });

      await GetUserByToken.send();

      expect(mockAxios.get).toHaveBeenCalledWith('User/api/v1/GetUserByToken');
    });

    it('should return success with data on status 200', async () => {
      const mockUserData = { id: 1, name: 'Test User', email: 'test@example.com' };
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: mockUserData,
      });

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: true,
        data: mockUserData,
      });
    });

    it('should return failure when status is not 200', async () => {
      mockAxios.get.mockResolvedValue({
        status: 401,
        data: null,
      });

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        data: null,
      });
    });

    it('should return failure with status 404', async () => {
      mockAxios.get.mockResolvedValue({
        status: 404,
        data: null,
      });

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        data: null,
      });
    });

    it('should handle network error with isNetworkError flag', async () => {
      const networkError = {
        isNetworkError: true,
      };
      mockAxios.get.mockRejectedValue(networkError);

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Unable to connect to the server. Please check your internet connection.',
          status: 0,
        },
      });
    });

    it('should handle API error with response data', async () => {
      const apiError = {
        response: {
          status: 401,
          data: {
            message: 'Token expired',
          },
        },
      };
      mockAxios.get.mockRejectedValue(apiError);

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Token expired',
          status: 401,
        },
      });
    });

    it('should return default error message when response has no message', async () => {
      const apiError = {
        response: {
          status: 500,
          data: {},
        },
      };
      mockAxios.get.mockRejectedValue(apiError);

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Failed to authenticate. Please try again.',
          status: 500,
        },
      });
    });

    it('should handle error without response object', async () => {
      const genericError = new Error('Unknown error');
      mockAxios.get.mockRejectedValue(genericError);

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Failed to authenticate. Please try again.',
          status: undefined,
        },
      });
    });

    it('should handle error with undefined response status', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Server error',
          },
        },
      };
      mockAxios.get.mockRejectedValue(apiError);

      const result = await GetUserByToken.send();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Server error',
          status: undefined,
        },
      });
    });
  });
});
