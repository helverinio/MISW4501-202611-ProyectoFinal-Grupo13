import { RegisterService, RegisterData } from '../RegisterService';
import customAxios from '../../../utils/api';

jest.mock('../../../utils/api');

const mockAxios = customAxios as jest.Mocked<typeof customAxios>;

describe('RegisterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    const validRegisterData: RegisterData = {
      nombre: 'John Doe',
      email: 'john@example.com',
      usuario: 'johndoe',
      contrasena: 'password123',
    };

    it('should call API with correct data', async () => {
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: { id: '1' },
      });

      await RegisterService.send(validRegisterData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/usuarios', {
        nombre: validRegisterData.nombre,
        email: validRegisterData.email,
        usuario: validRegisterData.usuario,
        contrasena: validRegisterData.contrasena,
      });
    });

    it('should return success with data on status 201', async () => {
      const mockResponseData = {
        id: '123',
        nombre: 'John Doe',
        email: 'john@example.com',
        usuario: 'johndoe',
      };
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: mockResponseData,
      });

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: true,
        data: mockResponseData,
      });
    });

    it('should return failure when status is not 201', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: {},
      });

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Registration failed',
          status: 200,
        },
      });
    });

    it('should return failure when status is 400', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: {},
      });

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Registration failed',
          status: 400,
        },
      });
    });

    it('should handle API error with error message in response', async () => {
      const apiError = {
        response: {
          status: 409,
          data: {
            error: 'Email already exists',
          },
        },
      };
      mockAxios.post.mockRejectedValue(apiError);

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Email already exists',
          status: 409,
        },
      });
    });

    it('should return default error message when no error in response', async () => {
      const apiError = {
        response: {
          status: 500,
          data: {},
        },
      };
      mockAxios.post.mockRejectedValue(apiError);

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Registration error',
          status: 500,
        },
      });
    });

    it('should handle error without response object', async () => {
      const genericError = new Error('Network error');
      mockAxios.post.mockRejectedValue(genericError);

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Registration error',
          status: undefined,
        },
      });
    });

    it('should handle API error with validation message', async () => {
      const apiError = {
        response: {
          status: 422,
          data: {
            error: 'Invalid email format',
          },
        },
      };
      mockAxios.post.mockRejectedValue(apiError);

      const result = await RegisterService.send(validRegisterData);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Invalid email format',
          status: 422,
        },
      });
    });

    it('should handle different user registration data', async () => {
      const differentUserData: RegisterData = {
        nombre: 'Jane Smith',
        email: 'jane@test.org',
        usuario: 'janesmith',
        contrasena: 'securePass456',
      };

      mockAxios.post.mockResolvedValue({
        status: 201,
        data: { id: '456', ...differentUserData },
      });

      await RegisterService.send(differentUserData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/usuarios', {
        nombre: 'Jane Smith',
        email: 'jane@test.org',
        usuario: 'janesmith',
        contrasena: 'securePass456',
      });
    });
  });
});
