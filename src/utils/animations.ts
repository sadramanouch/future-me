/**
 * Animation Utilities
 * Reusable animation primitives for the onboarding flow
 */

import { Animated, Easing } from 'react-native';

// Animation timing presets (milliseconds)
export const AnimationDuration = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  DRAMATIC: 1000,
  VERY_SLOW: 1500,
};

// Easing curves
export const AnimationEasing = {
  EASE_OUT: Easing.out(Easing.cubic),
  EASE_IN: Easing.in(Easing.cubic),
  EASE_IN_OUT: Easing.inOut(Easing.cubic),
  BOUNCE: Easing.bounce,
};

// Spring configuration presets
export const SpringConfig = {
  GENTLE: { tension: 20, friction: 7 },
  NORMAL: { tension: 40, friction: 7 },
  BOUNCY: { tension: 100, friction: 8 },
  STIFF: { tension: 200, friction: 20 },
};

/**
 * Fade in animation
 */
export const fadeIn = (
  animValue: Animated.Value,
  duration = AnimationDuration.NORMAL,
  delay = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue: 1,
    duration,
    delay,
    easing: AnimationEasing.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  animValue: Animated.Value,
  duration = AnimationDuration.FAST
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: AnimationEasing.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Slide up animation using spring
 */
export const slideUp = (
  animValue: Animated.Value,
  config = SpringConfig.GENTLE
): Animated.CompositeAnimation => {
  return Animated.spring(animValue, {
    toValue: 0,
    ...config,
    useNativeDriver: true,
  });
};

/**
 * Slide down animation
 */
export const slideDown = (
  animValue: Animated.Value,
  toValue: number,
  duration = AnimationDuration.NORMAL
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue,
    duration,
    easing: AnimationEasing.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Scale animation for buttons/elements
 */
export const scale = (
  animValue: Animated.Value,
  toValue: number,
  duration = AnimationDuration.FAST
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue,
    duration,
    easing: AnimationEasing.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Pulse animation (scale up and down)
 */
export const pulse = (
  animValue: Animated.Value,
  minScale = 0.98,
  maxScale = 1.02,
  duration = 1500
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing: AnimationEasing.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: minScale,
        duration: duration / 2,
        easing: AnimationEasing.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Staggered entrance animation for multiple elements
 */
export const staggeredEntrance = (
  animValues: Animated.Value[],
  staggerDelay = 100,
  duration = AnimationDuration.NORMAL
): Animated.CompositeAnimation => {
  return Animated.stagger(
    staggerDelay,
    animValues.map((av) => fadeIn(av, duration))
  );
};

/**
 * Combined fade + slide animation
 */
export const fadeSlideIn = (
  fadeAnim: Animated.Value,
  slideAnim: Animated.Value,
  fromY = 30,
  duration = AnimationDuration.SLOW
): Animated.CompositeAnimation => {
  slideAnim.setValue(fromY);
  return Animated.parallel([
    fadeIn(fadeAnim, duration),
    slideUp(slideAnim, SpringConfig.GENTLE),
  ]);
};

/**
 * Screen transition - crossfade between screens
 */
export const crossfade = (
  fadeOutAnim: Animated.Value,
  fadeInAnim: Animated.Value,
  duration = AnimationDuration.FAST
): Animated.CompositeAnimation => {
  return Animated.sequence([
    fadeOut(fadeOutAnim, duration),
    fadeIn(fadeInAnim, duration),
  ]);
};

/**
 * Create staggered word animations for titles
 */
export const createWordAnimations = (
  wordCount: number
): Animated.Value[] => {
  return Array.from({ length: wordCount }, () => new Animated.Value(0));
};

/**
 * Animate words appearing one by one
 */
export const animateWords = (
  wordAnims: Animated.Value[],
  staggerDelay = 200,
  duration = AnimationDuration.NORMAL
): Animated.CompositeAnimation => {
  return Animated.stagger(
    staggerDelay,
    wordAnims.map((anim) => fadeIn(anim, duration))
  );
};

/**
 * Hook helper: create fade and slide values
 */
export const createEntranceAnimValues = () => ({
  fadeAnim: new Animated.Value(0),
  slideAnim: new Animated.Value(30),
});

/**
 * Progress bar animation
 */
export const animateProgress = (
  animValue: Animated.Value,
  toValue: number,
  duration = AnimationDuration.SLOW
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue,
    duration,
    easing: AnimationEasing.EASE_OUT,
    useNativeDriver: false, // Width animation can't use native driver
  });
};
