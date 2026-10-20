/**
 * JourneyIntroScreen
 * Set expectations - "25 questions to bridge who you are and who you're becoming"
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
import { AnimationDuration, fadeSlideIn } from '../../utils/animations';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const JourneyIntroScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const slideAnims = useRef([
    new Animated.Value(30),
    new Animated.Value(30),
    new Animated.Value(30),
  ]).current;

  useEffect(() => {
    Animated.stagger(
      150,
      fadeAnims.map((fade, index) =>
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: AnimationDuration.NORMAL,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnims[index], {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate('AuthChoice');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Section 1: Question Count */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnims[0],
              transform: [{ translateY: slideAnims[0] }],
            },
          ]}
        >
          <Text style={styles.bigNumber}>7</Text>
          <Text style={styles.bigLabel}>Sections  ~10 min</Text>
        </Animated.View>

        {/* Section 2: Instructions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnims[1],
              transform: [{ translateY: slideAnims[1] }],
            },
          ]}
        >
          <Text style={styles.instruction}>
            Be honest. Be detailed.{'\n'}The more you give, the more your future self knows.
          </Text>
        </Animated.View>

        {/* Section 3: Objective */}
        <Animated.View
          style={[
            styles.objectiveCard,
            {
              opacity: fadeAnims[2],
              transform: [{ translateY: slideAnims[2] }],
            },
          ]}
        >
          <Text style={styles.objectiveLabel}>THE THESIS</Text>
          <Text style={styles.objectiveText}>
            To get what you want, you need to become the version of you who has it
          </Text>
        </Animated.View>
      </View>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Let's Begin"
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
  section: {
    alignItems: 'center',
    marginBottom: 48,
  },
  bigNumber: {
    fontSize: 96,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -4,
    lineHeight: 100,
  },
  bigLabel: {
    fontSize: 24,
    fontWeight: '500',
    color: '#8B949E',
    marginTop: -8,
  },
  instruction: {
    fontSize: 18,
    color: '#C9D1D9',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  objectiveCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  objectiveLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#238636',
    letterSpacing: 2,
    marginBottom: 12,
  },
  objectiveText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
});
