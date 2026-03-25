import { RequestResult } from '@/models/RequestResult';
import customAxios from '../../utils/api';


export const GetUserByToken = {
  send: async (): Promise<RequestResult> => {
    try {
      const url = 'User/api/v1/GetUserByToken';
      const response = await customAxios.get(url);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      }
      return {
        success: false,
        data: null,
      };
    } catch (error: any) {
      console.error('GetUserByToken error:', error);
      
      if (error.isNetworkError) {
        return {
          success: false,
          error: {
            message: 'Unable to connect to the server. Please check your internet connection.',
            status: 0 // Use 0 to indicate network connectivity issue
          },
        };
      }
      
      // Handle other types of errors
      return {
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to authenticate. Please try again.',
          status: error.response?.status
        },
      };
    }
  },
};
