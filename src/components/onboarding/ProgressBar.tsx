/**
 * ProgressBar Component
 * Thin progress indicator at top of onboarding screens
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AnimationDuration, AnimationEasing } from '../../utils/animations';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: AnimationDuration.SLOW,
      easing: AnimationEasing.EASE_OUT,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Color shifts from blue to green as progress increases
  const colorInterpolation = animatedWidth.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['#58A6FF', '#3FB950', '#238636'],
  });

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.progress,
          {
            width: widthInterpolation,
            backgroundColor: colorInterpolation,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#21262D',
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 2,
  },
});
