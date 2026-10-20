/**
 * PaymentGateScreen - Subscription paywall before accessing AI agent
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/Storage';

type Props = { navigation: NativeStackNavigationProp<any> };

const FEATURES = [
  { icon: '💬', text: 'Unlimited conversations with your Future Self' },
  { icon: '📊', text: 'Personal growth tracking & insights' },
  { icon: '🎯', text: 'Daily challenges & goal tracking' },
  { icon: '📝', text: 'Full conversation history' },
];

export const PaymentGateScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkPaymentReturn();
  }, []);

  const checkPaymentReturn = async () => {
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true') {
        setVerifying(true);
        setSuccess('Payment received! Verifying...');
        // Poll for payment status (webhook may take a moment)
        for (let i = 0; i < 10; i++) {
          try {
            const status = await AuthService.getPaymentStatus();
            if (status.hasAccess) {
              await StorageService.savePaymentStatus(status);
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname);
              setSuccess('Payment confirmed! Welcome aboard.');
              setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'Reveal' }] });
              }, 1500);
              return;
            }
          } catch {
            // Keep polling
          }
          await new Promise(r => setTimeout(r, 2000));
        }
        setError('Payment verification timed out. Please refresh or contact support.');
        setVerifying(false);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      if (params.get('payment_cancelled') === 'true') {
        setError('Payment was cancelled. You can try again anytime.');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    setVerifying(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const { url } = await AuthService.createCheckoutSession();
      if (Platform.OS === 'web') {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await AuthService.validatePromoCode(promoCode.trim());
      if (result.valid) {
        await StorageService.savePaymentStatus({
          hasAccess: true,
          status: 'promo',
          planType: 'promo',
        });
        setSuccess(result.message || 'Promo code applied! Full access granted.');
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Reveal' }] });
        }, 1500);
      } else {
        setError(result.message || 'Invalid promo code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  if (verifying) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={[styles.verifyingText, { color: colors.textSecondary }]}>
            {success || 'Checking payment status...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Unlock Your Future Self</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start your personal growth journey with unlimited AI guidance
        </Text>

        {/* Pricing Card */}
        <View style={[styles.pricingCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.text }]}>$9.99</Text>
            <Text style={[styles.period, { color: colors.textMuted }]}>/month</Text>
          </View>

          <View style={styles.featureList}>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.accent }]}
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Promo Code */}
        <View style={[styles.promoCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Have a promo code?</Text>
          <View style={styles.promoInputRow}>
            <TextInput
              style={[styles.promoInput, { backgroundColor: colors.bgTertiary, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter code"
              placeholderTextColor={colors.textMuted}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              editable={!promoLoading}
            />
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.accentBlue }]}
              onPress={handlePromoCode}
              disabled={promoLoading || !promoCode.trim()}
              activeOpacity={0.8}
            >
              {promoLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Messages */}
        {error ? (
          <View style={[styles.messageBanner, { backgroundColor: '#3D1F1F' }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={[styles.messageBanner, { backgroundColor: '#1F3D2A' }]}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  verifyingText: { marginTop: 16, fontSize: 16 },
  scrollContent: { padding: 24, paddingBottom: 60, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 40, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22, maxWidth: 320 },
  pricingCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 24 },
  price: { fontSize: 42, fontWeight: '800' },
  period: { fontSize: 16, marginLeft: 4 },
  featureList: { marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: { fontSize: 18, marginRight: 12, width: 24 },
  featureText: { fontSize: 14, flex: 1, lineHeight: 20 },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 400, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 14 },
  promoCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  promoLabel: { fontSize: 14, marginBottom: 12, fontWeight: '600' },
  promoInputRow: { flexDirection: 'row', gap: 10 },
  promoInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  applyButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  messageBanner: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  errorText: { color: '#F85149', fontSize: 14, textAlign: 'center' },
  successText: { color: '#56D364', fontSize: 14, textAlign: 'center' },
});
