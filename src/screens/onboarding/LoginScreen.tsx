/**
 * LoginScreen - For returning users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { AuthService } from '../../services/AuthService';
import { StorageService } from '../../services/Storage';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Basic validation
    let hasErrors = false;
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    }

    setErrors(newErrors);
    if (hasErrors) return;

    setIsLoading(true);
    setLoginError(null);

    try {
      // Authenticate with backend server
      const response = await AuthService.login(email.trim(), password);

      if (response.hasProfile && response.profile) {
        // User has a profile - sync and check payment
        await AuthService.syncData();
        let destination: string = 'PaymentGate';
        try {
          const paymentStatus = await AuthService.getPaymentStatus();
          if (paymentStatus.hasAccess) {
            await StorageService.savePaymentStatus(paymentStatus);
            destination = 'Chat';
          }
        } catch {
          // Can't reach payment endpoint — send to payment gate
        }
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: destination }],
          })
        );
      } else {
        // User exists but no profile - go to onboarding
        setLoginError('Your account exists but your profile isn\'t set up yet. Let\'s fix that.');
        setTimeout(() => navigation.navigate('BasicData'), 2000);
      }
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Cannot connect') || msg.includes('Failed to fetch') || msg.includes('Network')) {
        setLoginError('Can\'t reach the server right now. If you\'re a new user, tap "Sign up" below to get started.');
      } else if (msg.includes('401') || msg.includes('Invalid') || msg.includes('credentials')) {
        setLoginError('Email or password is incorrect. Double-check your details or create a new account below.');
      } else if (msg.includes('404') || msg.includes('not found')) {
        setLoginError('No account found with this email. Tap "Sign up" below to create one.');
      } else {
        setLoginError(msg || 'Something went wrong. Try again or create a new account below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#6E7681"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#6E7681"
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Error */}
          {loginError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{loginError}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupLink}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('BasicData')}>
              <Text style={styles.signupLinkText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#8B949E',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9D1D9',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#F85149',
  },
  errorText: {
    fontSize: 13,
    color: '#F85149',
    marginTop: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#58A6FF',
  },
  errorBanner: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderWidth: 1,
    borderColor: '#F85149',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#F85149',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#238636',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#1B4F28',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#8B949E',
  },
  signupLinkText: {
    fontSize: 14,
    color: '#58A6FF',
    fontWeight: '600',
  },
});
