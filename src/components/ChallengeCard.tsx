/**
 * ChallengeCard - Daily micro-challenge display
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { hapticSuccess } from '../utils/haptics';
import { DailyChallenge } from '../types/Memory';

interface ChallengeCardProps {
  challenge: DailyChallenge;
  onComplete: () => void;
  onSkip: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onComplete, onSkip }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleComplete = () => {
    hapticSuccess();
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onComplete);
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onSkip);
  };

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: colors.bgSecondary, borderColor: colors.accent, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.accent }]}>TODAY'S CHALLENGE</Text>
      </View>
      <Text style={[styles.challenge, { color: colors.text }]}>{challenge.challenge}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.accent }]}
          onPress={handleComplete}
        >
          <Text style={styles.doneText}>Done ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  challenge: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
  },
});
