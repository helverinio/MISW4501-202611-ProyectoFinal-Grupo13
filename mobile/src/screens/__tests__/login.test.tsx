import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../login';
import { AuthService } from '../../services/authService/AuthService';
import { RegisterService } from '../../services/userService/RegisterService';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../services/authService/AuthService');
jest.mock('../../services/userService/RegisterService');
jest.mock('../../common/LanguageSelector', () => 'LanguageSelector');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockRegisterService = RegisterService as jest.Mocked<typeof RegisterService>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const renderAndWaitForAuth = async () => {
  const result = render(<LoginScreen />);
  await waitFor(() => {
    expect(result.queryByText('common.appName')).toBeTruthy();
  });
  return result;
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('should render login form by default', async () => {
      const { getByText, getByPlaceholderText } = await renderAndWaitForAuth();

      expect(getByText('common.appName')).toBeTruthy();
      expect(getByText('auth.login')).toBeTruthy();
      expect(getByText('auth.register')).toBeTruthy();
      expect(getByText('auth.email')).toBeTruthy();
      expect(getByText('auth.password')).toBeTruthy();
      expect(getByPlaceholderText('auth.emailPlaceholder')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('auth.loginButton')).toBeTruthy();
    });

    it('should render remember me checkbox', async () => {
      const { getByText } = await renderAndWaitForAuth();
      expect(getByText('auth.rememberMe')).toBeTruthy();
    });

    it('should render forgot password link', async () => {
      const { getByText } = await renderAndWaitForAuth();
      expect(getByText('auth.forgotPassword')).toBeTruthy();
    });

    it('should render security badges in footer', async () => {
      const { getByText } = await renderAndWaitForAuth();
      expect(getByText('common.secure')).toBeTruthy();
      expect(getByText('common.encrypted')).toBeTruthy();
      expect(getByText('common.certified')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to register tab when register is pressed', async () => {
      const { getByText, queryByText } = await renderAndWaitForAuth();

      const registerTab = getByText('auth.register');
      fireEvent.press(registerTab);

      expect(getByText('auth.fullName')).toBeTruthy();
      expect(getByText('auth.confirmPassword')).toBeTruthy();
      expect(getByText('auth.registerButton')).toBeTruthy();
    });

    it('should switch back to login tab when login is pressed', async () => {
      const { getByText, queryByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));
      expect(getByText('auth.fullName')).toBeTruthy();

      fireEvent.press(getByText('auth.login'));
      expect(queryByText('auth.fullName')).toBeNull();
      expect(getByText('auth.loginButton')).toBeTruthy();
    });

    it('should clear errors when switching tabs', async () => {
      const { getByText, getByPlaceholderText, queryByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.loginButton'));
      expect(getByText('auth.errors.emptyFields')).toBeTruthy();

      fireEvent.press(getByText('auth.register'));
      expect(queryByText('auth.errors.emptyFields')).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    it('should show error when login fields are empty', async () => {
      const { getByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.loginButton'));

      expect(getByText('auth.errors.emptyFields')).toBeTruthy();
      expect(mockAuthService.send).not.toHaveBeenCalled();
    });

    it('should show error when only email is provided', async () => {
      const { getByText, getByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      fireEvent.press(getByText('auth.loginButton'));

      expect(getByText('auth.errors.emptyFields')).toBeTruthy();
    });

    it('should show error when only password is provided', async () => {
      const { getByText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.press(getByText('auth.loginButton'));

      expect(getByText('auth.errors.emptyFields')).toBeTruthy();
    });

    it('should call AuthService.send with correct credentials on valid login', async () => {
      mockAuthService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(mockAuthService.send).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should navigate to landing screen on successful login', async () => {
      mockAuthService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/screens/landing');
      });
    });

    it('should show error message on failed login', async () => {
      mockAuthService.send.mockResolvedValue({
        success: false,
        error: { message: 'Invalid credentials' },
      });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'wrongpassword');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy();
      });
    });

    it('should show default error message when login fails without message', async () => {
      mockAuthService.send.mockResolvedValue({ success: false });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(getByText('auth.errors.loginFailed')).toBeTruthy();
      });
    });

    it('should show unexpected error on AuthService exception', async () => {
      mockAuthService.send.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(getByText('auth.errors.unexpectedError')).toBeTruthy();
      });
    });
  });

  describe('Registration Functionality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should show error when registration fields are empty', async () => {
      const { getByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));
      fireEvent.press(getByText('auth.registerButton'));

      expect(getByText('auth.errors.allFieldsRequired')).toBeTruthy();
      expect(mockRegisterService.send).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', async () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'differentpassword');

      fireEvent.press(getByText('auth.registerButton'));

      expect(getByText('auth.errors.passwordMismatch')).toBeTruthy();
    });

    it('should show error when password is too short', async () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], '12345');
      fireEvent.changeText(passwordInputs[1], '12345');

      fireEvent.press(getByText('auth.registerButton'));

      expect(getByText('auth.errors.passwordLength')).toBeTruthy();
    });

    it('should call RegisterService.send with correct data on valid registration', async () => {
      mockRegisterService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await waitFor(() => {
        expect(mockRegisterService.send).toHaveBeenCalledWith({
          nombre: 'John Doe',
          email: 'john@example.com',
          usuario: 'john@example.com',
          contrasena: 'password123',
        });
      });
    });

    it('should show success message on successful registration', async () => {
      mockRegisterService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await waitFor(() => {
        expect(getByText('auth.registerSuccess')).toBeTruthy();
      });
    });

    it('should switch to login tab after successful registration', async () => {
      mockRegisterService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText, queryByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(getByText('auth.loginButton')).toBeTruthy();
        expect(queryByText('auth.registerSuccess')).toBeNull();
      });
    });

    it('should show error message on failed registration', async () => {
      mockRegisterService.send.mockResolvedValue({
        success: false,
        error: { message: 'Email already exists' },
      });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'existing@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await waitFor(() => {
        expect(getByText('Email already exists')).toBeTruthy();
      });
    });

    it('should show default error message when registration fails without message', async () => {
      mockRegisterService.send.mockResolvedValue({ success: false });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await waitFor(() => {
        expect(getByText('auth.errors.registerFailed')).toBeTruthy();
      });
    });

    it('should show unexpected error on RegisterService exception', async () => {
      mockRegisterService.send.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      await waitFor(() => {
        expect(getByText('auth.errors.unexpectedError')).toBeTruthy();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle login password visibility', async () => {
      const { getAllByPlaceholderText, getByTestId } = await renderAndWaitForAuth();

      const passwordInputs = getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should toggle register password visibility', async () => {
      const { getByText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      const passwordInputs = getAllByPlaceholderText('••••••••');
      expect(passwordInputs[0].props.secureTextEntry).toBe(true);
      expect(passwordInputs[1].props.secureTextEntry).toBe(true);
    });
  });

  describe('Remember Me Checkbox', () => {
    it('should toggle remember me checkbox', async () => {
      const { getByText } = await renderAndWaitForAuth();

      const rememberMeText = getByText('auth.rememberMe');
      fireEvent.press(rememberMeText);
    });
  });

  describe('Input Field Behavior', () => {
    it('should update login email on change', async () => {
      const { getByPlaceholderText } = await renderAndWaitForAuth();

      const emailInput = getByPlaceholderText('auth.emailPlaceholder');
      fireEvent.changeText(emailInput, 'newemail@test.com');

      expect(emailInput.props.value).toBe('newemail@test.com');
    });

    it('should update login password on change', async () => {
      const { getAllByPlaceholderText } = await renderAndWaitForAuth();

      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'newpassword');

      expect(passwordInputs[0].props.value).toBe('newpassword');
    });

    it('should update registration fields on change', async () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      const nameInput = getByPlaceholderText('auth.fullNamePlaceholder');
      const emailInput = getByPlaceholderText('auth.emailPlaceholder');
      const passwordInputs = getAllByPlaceholderText('••••••••');

      fireEvent.changeText(nameInput, 'Jane Doe');
      fireEvent.changeText(emailInput, 'jane@example.com');
      fireEvent.changeText(passwordInputs[0], 'securepass');
      fireEvent.changeText(passwordInputs[1], 'securepass');

      expect(nameInput.props.value).toBe('Jane Doe');
      expect(emailInput.props.value).toBe('jane@example.com');
      expect(passwordInputs[0].props.value).toBe('securepass');
      expect(passwordInputs[1].props.value).toBe('securepass');
    });
  });

  describe('Loading State', () => {
    it('should disable login button while loading', async () => {
      let resolvePromise: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthService.send.mockReturnValue(loginPromise as any);

      const { getByText, getByPlaceholderText, getAllByPlaceholderText, queryByText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      expect(queryByText('auth.loginButton')).toBeNull();

      await act(async () => {
        resolvePromise!({ success: true, data: {} });
      });
    });

    it('should disable register button while loading', async () => {
      let resolvePromise: (value: any) => void;
      const registerPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockRegisterService.send.mockReturnValue(registerPromise as any);

      const { getByText, getByPlaceholderText, getAllByPlaceholderText, queryByText } = await renderAndWaitForAuth();

      fireEvent.press(getByText('auth.register'));

      fireEvent.changeText(getByPlaceholderText('auth.fullNamePlaceholder'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'john@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');
      fireEvent.changeText(passwordInputs[1], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.registerButton'));
      });

      expect(queryByText('auth.registerButton')).toBeNull();

      await act(async () => {
        resolvePromise!({ success: true, data: {} });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should trim whitespace from login email', async () => {
      mockAuthService.send.mockResolvedValue({ success: true, data: {} });

      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), '  test@example.com  ');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      await act(async () => {
        fireEvent.press(getByText('auth.loginButton'));
      });

      await waitFor(() => {
        expect(mockAuthService.send).toHaveBeenCalledWith('  test@example.com  ', 'password123');
      });
    });

    it('should handle whitespace-only email as empty', async () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), '   ');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], 'password123');

      fireEvent.press(getByText('auth.loginButton'));

      expect(getByText('auth.errors.emptyFields')).toBeTruthy();
      expect(mockAuthService.send).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only password as empty', async () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = await renderAndWaitForAuth();

      fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
      const passwordInputs = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInputs[0], '   ');

      fireEvent.press(getByText('auth.loginButton'));

      expect(getByText('auth.errors.emptyFields')).toBeTruthy();
      expect(mockAuthService.send).not.toHaveBeenCalled();
    });
  });
});
