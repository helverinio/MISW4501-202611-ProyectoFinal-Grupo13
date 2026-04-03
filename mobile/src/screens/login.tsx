import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../services/authService/AuthService';
import { RegisterService } from '../services/userService/RegisterService';
import { Ionicons } from '@expo/vector-icons';
import LanguageSelector from '../common/LanguageSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('_x');
      if (token) {
        router.replace('/screens/landing' as Href);
      }
    } catch (error) {
      console.error('Error checking existing token:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration fields
  const [nombre, setNombre] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError(t('auth.errors.emptyFields'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.send(loginEmail, loginPassword);

      if (result.success) {
        router.replace('/screens/landing' as Href);
      } else {
        setError(result.error?.message || t('auth.errors.loginFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
  };

  const handleCreateAccount = () => {
    setActiveTab('register');
    setError(null);
    setSuccessMessage(null);
  };

  const handleRegister = async () => {
    if (!nombre.trim() || !registerEmail.trim() || !registerPassword.trim() || !confirmPassword.trim()) {
      setError(t('auth.errors.allFieldsRequired'));
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    if (registerPassword.length < 6) {
      setError(t('auth.errors.passwordLength'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await RegisterService.send({
        nombre,
        email: registerEmail,
        usuario: registerEmail,
        contrasena: registerPassword,
      });

      if (result.success) {
        setSuccessMessage(t('auth.registerSuccess'));
        // Clear registration fields
        setNombre('');
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
        // Switch to login tab after a brief delay
        setTimeout(() => {
          setActiveTab('login');
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError(result.error?.message || t('auth.errors.registerFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7BF7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Selector */}
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector />
          </View>

          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="navigate" size={24} color="#fff" />
            </View>
            <Text style={styles.logoText}>{t('common.appName')}</Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => handleTabChange('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                {t('auth.login')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'register' && styles.activeTab]}
              onPress={() => handleTabChange('register')}
            >
              <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                {t('auth.register')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {activeTab === 'login' ? (
              <>
                {/* Email Field */}
                <Text style={styles.inputLabel}>{t('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="#999"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                </View>

                {/* Password Field */}
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!showLoginPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                    style={styles.inputIcon}
                  >
                    <Ionicons 
                      name={showLoginPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>{t('auth.rememberMe')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.loginButton')}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Registration Form */}
                {/* Name Field */}
                <Text style={styles.inputLabel}>{t('auth.fullName')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.fullNamePlaceholder')}
                    placeholderTextColor="#999"
                    value={nombre}
                    onChangeText={setNombre}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                  <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                </View>

                {/* Email Field */}
                <Text style={styles.inputLabel}>{t('auth.email')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="#999"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                </View>

                {/* Password Field */}
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    secureTextEntry={!showRegisterPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowRegisterPassword(!showRegisterPassword)}
                    style={styles.inputIcon}
                  >
                    <Ionicons 
                      name={showRegisterPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Field */}
                <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.inputIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
                {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.registerButton')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.securityBadges}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.badgeText}>{t('common.secure')}</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="lock-closed" size={16} color="#4CAF50" />
                <Text style={styles.badgeText}>{t('common.encrypted')}</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="ribbon" size={16} color="#4CAF50" />
                <Text style={styles.badgeText}>{t('common.certified')}</Text>
              </View>
            </View>
            <Text style={styles.footerText}>
              {t('common.securityMessage')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  languageSelectorContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A7BF7',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4A7BF7',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#4A7BF7',
    borderColor: '#4A7BF7',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#4A7BF7',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4A7BF7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A8C0F7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  securityBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
