/**
 * SignupScreen - Final step after onboarding questionnaires
 * Collects name, email, password, phone with validation, requires terms acceptance
 * Works in local-only mode if backend is unavailable
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useOnboarding } from '../../context/OnboardingContext';
import { AuthService } from '../../services/AuthService';
import { StorageService } from '../../services/Storage';
import { ClaudeAPIService } from '../../services/ClaudeAPI';
import { calculateFutureAge } from '../../types/Onboarding';

const PROFILE_IMAGE_KEY = '@future_you:profile_image';
const AGED_IMAGE_KEY = '@future_you:aged_image';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LegalType = 'terms' | 'privacy' | null;

const TERMS_CONTENT = `FUTURE ME - PROTOTYPE USE NOTICE

This community release is an experimental development prototype. Use synthetic
profiles and test accounts. Do not enter private journal text, real selfies or
sensitive personal information.

The simulated future self is AI-generated. It can be inaccurate or inappropriate
and cannot predict your future. It is not medical, psychological, financial or
legal advice and is not a substitute for professional care.

The source code is available under the repository's MIT license. Third-party
packages, models and services retain their own terms. Operators must configure
their own infrastructure, paid-service accounts and policies before hosting.

Authentication, storage, privacy controls and dependencies need further work.
There is no production-readiness or security guarantee. Account-wide deletion
and export controls have not been implemented or verified.

For community development questions, use the GitHub repository's issues. Never
include personal data or credentials. Report vulnerabilities privately through
GitHub Security. A future hosted service needs its own reviewed terms and policy.`;

const PRIVACY_CONTENT = `FUTURE ME - PROTOTYPE DATA DISCLOSURE

Use synthetic data only. This is an implementation disclosure for developers,
not a reviewed privacy policy for a hosted service.

The app collects account fields and onboarding answers to build a persona.
Profiles, messages and authentication tokens use AsyncStorage or local files.
The app does not add encryption to AsyncStorage; it is not a secure secret store.

The backend stores account and profile data in SQLite and may store conversation,
reflection and memory data. Database encryption, user isolation, retention,
secure token storage and backup handling require further review.

When live AI is configured, conversation and persona data pass through the
backend to the configured AI provider. Server operators and providers process
that data. Do not assume conversations are device-only, end-to-end encrypted or
inaccessible to the operator. Provider retention depends on the configured
service and its current terms; this prototype makes no zero-retention promise.

Subscription and image features can involve additional services when configured.
Operators must document the complete data flow for their own deployment.

Complete account deletion, export and a verified retention policy remain open
work. Clearing app data does not establish deletion of server data or backups.
Do not use this prototype for real-user hosting until those controls and the
outstanding security issues have been addressed and verified.

For development questions use GitHub issues without personal data. For security
issues use the repository's private vulnerability reporting feature.`;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { progress, setBasicData, completeOnboarding } = useOnboarding();

  const [name, setName] = useState(progress.basicData.name || '');
  const [email, setEmail] = useState(progress.basicData.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(progress.basicData.phone || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string; terms?: string }>({});
  const [legalModal, setLegalModal] = useState<LegalType>(null);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    }
    if (value.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: undefined }));
    return true;
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (value.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const validatePhone = (value: string): boolean => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required' }));
      return false;
    }
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrors(prev => ({ ...prev, phone: 'Phone number must be at least 10 digits' }));
      return false;
    }
    if (digitsOnly.length > 15) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is too long' }));
      return false;
    }
    if (/^(\d)\1+$/.test(digitsOnly)) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
      return false;
    }
    setErrors(prev => ({ ...prev, phone: undefined }));
    return true;
  };

  const handleSignup = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isPhoneValid = validatePhone(phone);

    if (!acceptedTerms) {
      setErrors(prev => ({ ...prev, terms: 'Acknowledge the prototype notices to continue' }));
      return;
    }

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isPhoneValid) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try backend signup (gracefully skip if server unavailable)
      try {
        await AuthService.signup(
          email.trim(),
          password,
          name.trim(),
          phone.trim()
        );
      } catch (authError: any) {
        const msg = authError.message || '';
        if (msg.includes('Cannot connect') || msg.includes('Failed to fetch') || msg.includes('Network')) {
          console.log('Backend unavailable, proceeding with local-only mode');
        } else {
          throw authError;
        }
      }

      // 2. Complete onboarding and create future self profile locally
      await completeOnboarding({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      // 3. Try to save profile to backend (non-blocking)
      const futureSelf = await StorageService.getFutureSelf();
      if (futureSelf) {
        AuthService.saveProfile(futureSelf).catch(() => {});
      }

      // 4. Generate opening message in background (don't block navigation)
      if (futureSelf) {
        const onboardingProfile = await StorageService.getOnboardingProfile();
        ClaudeAPIService.generateOpeningMessage(futureSelf, onboardingProfile)
          .then(msg => StorageService.saveOpeningMessage(msg))
          .catch(err => console.error('Opening message generation failed:', err));
      }

      // 5. Age profile photo in background (don't block navigation)
      const selfieUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (selfieUri && progress.basicData.dateOfBirth) {
        const dob = new Date(progress.basicData.dateOfBirth);
        const today = new Date();
        let currentAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) currentAge--;
        const targetAge = calculateFutureAge(currentAge);

        FileSystem.readAsStringAsync(selfieUri, { encoding: FileSystem.EncodingType.Base64 })
          .then(base64 => AuthService.agePhoto(base64, currentAge, targetAge))
          .then(async (agedBase64) => {
            if (agedBase64) {
              await AsyncStorage.setItem(AGED_IMAGE_KEY, `data:image/jpeg;base64,${agedBase64}`);
            }
          })
          .catch(err => console.error('Photo aging failed:', err));
      }

      // Navigate to payment gate
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'PaymentGate' }],
        })
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLegalModal = () => (
    <Modal
      visible={legalModal !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setLegalModal(null)}
    >
      <SafeAreaView style={legalStyles.container}>
        <View style={legalStyles.header}>
          <Text style={legalStyles.headerTitle}>
            {legalModal === 'terms' ? 'Prototype Use Notice' : 'Data Disclosure'}
          </Text>
          <TouchableOpacity
            style={legalStyles.closeButton}
            onPress={() => setLegalModal(null)}
            activeOpacity={0.7}
          >
            <Text style={legalStyles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={legalStyles.scrollView}
          contentContainerStyle={legalStyles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={legalStyles.body}>
            {legalModal === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderLegalModal()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Almost there!</Text>
            <Text style={styles.subtitle}>
              Create your account to save your progress and start your journey with Future You.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) validateName(text);
                }}
                onBlur={() => validateName(name)}
                placeholder="Your name"
                placeholderTextColor="#6E7681"
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="you@example.com"
                placeholderTextColor="#6E7681"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) validatePassword(text);
                }}
                onBlur={() => validatePassword(password)}
                placeholder="At least 8 characters"
                placeholderTextColor="#6E7681"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone ? styles.inputError : null]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) validatePhone(text);
                }}
                onBlur={() => validatePhone(phone)}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#6E7681"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAcceptedTerms(!acceptedTerms);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: undefined }));
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I acknowledge the{' '}
                <Text style={styles.link} onPress={() => setLegalModal('terms')}>
                  Prototype Use Notice
                </Text>
                {' '}and{' '}
                <Text style={styles.link} onPress={() => setLegalModal('privacy')}>
                  Data Disclosure
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { marginTop: 4 }]}>{errors.terms}</Text>
            )}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account & Start</Text>
            )}
          </TouchableOpacity>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Secure & private conversations</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Unlimited access to your future self</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Personal growth tracking</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const legalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#21262D',
    borderRadius: 8,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#58A6FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  body: {
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
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
    lineHeight: 24,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#30363D',
    backgroundColor: '#0D1117',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  link: {
    color: '#58A6FF',
    textDecorationLine: 'underline',
  },
  signupButton: {
    backgroundColor: '#238636',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  signupButtonDisabled: {
    backgroundColor: '#1B4F28',
  },
  signupButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#238636',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 12,
    color: '#6E7681',
    textAlign: 'center',
    lineHeight: 16,
  },
});
