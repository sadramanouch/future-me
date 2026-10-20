/**
 * FutureTransitionScreen
 * Mindset shift: from mapping who you are → to designing who you become
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

export const FutureTransitionScreen: React.FC<Props> = ({ navigation }) => {
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const permissionOpacity = useRef(new Animated.Value(0)).current;
  const permissionScale = useRef(new Animated.Value(0.95)).current;

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
        Animated.timing(permissionOpacity, {
          toValue: 1,
          duration: AnimationDuration.DRAMATIC,
          useNativeDriver: true,
        }),
        Animated.spring(permissionScale, {
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
    navigation.navigate('OnboardingChapter', { chapter: 'yourFuture' });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ProfileBuildProgress completedCount={4} />

        {/* Quote */}
        <Animated.View
          style={[styles.quoteContainer, { opacity: quoteOpacity }]}
        >
          <Text style={styles.quoteText}>
            "You've mapped where you are.{'\n'}Now design where you're going."
          </Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View style={[styles.divider, { opacity: dividerOpacity }]} />

        {/* Permission Statement */}
        <Animated.View
          style={[
            styles.permissionContainer,
            {
              opacity: permissionOpacity,
              transform: [{ scale: permissionScale }],
            },
          ]}
        >
          <Text style={styles.permissionLabel}>REMEMBER</Text>
          <Text style={styles.permissionText}>
            You can't go somewhere you don't know.
          </Text>
          <Text style={styles.permissionSubtext}>
            Be as specific and vivid as possible. The clearer the picture, the faster you get there.
          </Text>
        </Animated.View>
      </View>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Design Your Future"
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
  permissionContainer: {
    alignItems: 'center',
  },
  permissionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#238636',
    letterSpacing: 3,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});
