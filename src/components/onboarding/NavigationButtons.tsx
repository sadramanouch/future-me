/**
 * NavigationButtons Component
 * Back/Continue footer for onboarding screens
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface NavigationButtonsProps {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  showBack?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  showBack = true,
  disabled = false,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      {showBack && onBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <TouchableOpacity
        style={[
          styles.continueButton,
          disabled && styles.continueButtonDisabled,
        ]}
        onPress={onContinue}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={[
              styles.continueText,
              disabled && styles.continueTextDisabled,
            ]}
          >
            {continueLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#0F1419',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  spacer: {
    width: 80,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backText: {
    fontSize: 16,
    color: '#8B949E',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#238636',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#1B4F28',
  },
  continueText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueTextDisabled: {
    opacity: 0.5,
  },
});
