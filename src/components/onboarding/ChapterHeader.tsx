/**
 * ChapterHeader Component
 * Section headers for onboarding chapters
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { fadeSlideIn, AnimationDuration } from '../../utils/animations';

interface ChapterHeaderProps {
  title: string;
  subtitle?: string;
  whyHint?: string;
  questionNumber?: number;
  totalQuestions?: number;
}

export const ChapterHeader: React.FC<ChapterHeaderProps> = ({
  title,
  subtitle,
  whyHint,
  questionNumber,
  totalQuestions,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeSlideIn(fadeAnim, slideAnim, 20, AnimationDuration.NORMAL).start();
  }, [title]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {questionNumber !== undefined && totalQuestions !== undefined && (
        <Text style={styles.progress}>
          Question {questionNumber} of {totalQuestions}
        </Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {whyHint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintIcon}>{'///'}</Text>
          <Text style={styles.hintText}>{whyHint}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  progress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58A6FF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    lineHeight: 24,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingLeft: 2,
  },
  hintIcon: {
    fontSize: 12,
    color: '#58A6FF',
    marginRight: 8,
    marginTop: 1,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hintText: {
    fontSize: 13,
    color: '#6E7681',
    lineHeight: 19,
    fontStyle: 'italic',
    flex: 1,
  },
});
