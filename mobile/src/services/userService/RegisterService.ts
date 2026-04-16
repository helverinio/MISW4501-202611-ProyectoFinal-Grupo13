import hashingUtility from '../../utils/hashingUtility';
import customAxios from '@/utils/api';

export interface RegisterResult {
  success: boolean;
  data?: {
    id: string;
    nombre: string;
    email: string;
    usuario: string;
  };
  error?: {
    message: string;
    status?: number;
  };
}

export interface RegisterData {
  nombre: string;
  email: string;
  usuario: string;
  contrasena: string;
}

export const RegisterService = {
  send: async (data: RegisterData): Promise<RegisterResult> => {
    try {
      const url = '/api/v1/usuarios';

      // const hashedPassword = await hashingUtility(data.contrasena);

      const response = await customAxios.post(url, {
        nombre: data.nombre,
        email: data.email,
        usuario: data.usuario,
        contrasena: data.contrasena,
      });

      if (response.status === 201) {
        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Registration failed',
          status: response.status,
        },
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.error || 'Registration error';
      
      return {
        success: false,
        error: {
          message: errorMessage,
          status: error.response?.status,
        },
      };
    }
  },
};

export default RegisterService;
