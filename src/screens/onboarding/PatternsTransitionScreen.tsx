/**
 * PatternsTransitionScreen
 * Emotional breathing point between Identity and Patterns chapters
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationButtons } from '../../components/onboarding';
import { ProfileBuildProgress } from '../../components/onboarding/ProfileBuildProgress';
import { AnimationDuration } from '../../utils/animations';
import { hapticSuccess } from '../../utils/haptics';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const PatternsTransitionScreen: React.FC<Props> = ({ navigation }) => {
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(quoteOpacity, {
        toValue: 1,
        duration: AnimationDuration.VERY_SLOW,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(dividerOpacity, {
        toValue: 1,
        duration: AnimationDuration.NORMAL,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: AnimationDuration.DRAMATIC,
          useNativeDriver: true,
        }),
        Animated.spring(messageScale, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    hapticSuccess();
    navigation.navigate('OnboardingChapter', { chapter: 'innerWorld' });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ProfileBuildProgress completedCount={3} />

        <Animated.View
          style={[styles.quoteContainer, { opacity: quoteOpacity }]}
        >
          <Text style={styles.quoteText}>
            "You just shared your story.{'\n'}Now let's look at your patterns."
          </Text>
        </Animated.View>

        <Animated.View style={[styles.divider, { opacity: dividerOpacity }]} />

        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: messageOpacity,
              transform: [{ scale: messageScale }],
            },
          ]}
        >
          <Text style={styles.messageLabel}>NEXT</Text>
          <Text style={styles.messageText}>
            Your highest self and your lowest self.
          </Text>
          <Text style={styles.messageSubtext}>
            Both live inside you. Naming them is the first step to choosing which one leads.
          </Text>
        </Animated.View>
      </View>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Continue"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteContainer: {
    marginBottom: 48,
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#C9D1D9',
    textAlign: 'center',
    lineHeight: 34,
    fontStyle: 'italic',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#238636',
    marginBottom: 48,
  },
  messageContainer: {
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#238636',
    letterSpacing: 3,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageSubtext: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});
