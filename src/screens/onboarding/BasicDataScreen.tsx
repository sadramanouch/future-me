/**
 * BasicDataScreen
 * Collect just date of birth for future age calculation
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
import { useOnboarding } from '../../context/OnboardingContext';
import {
  ProgressBar,
  NavigationButtons,
  DatePickerField,
} from '../../components/onboarding';
import { calculateFutureAge } from '../../types/Onboarding';
import { AnimationDuration } from '../../utils/animations';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const BasicDataScreen: React.FC<Props> = ({ navigation }) => {
  const {
    progress,
    setBasicData,
    progressPercentage,
    markScreenCompleted,
  } = useOnboarding();

  const { basicData } = progress;

  // Calculate current age from DOB
  const calculateCurrentAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateCurrentAge(basicData.dateOfBirth || '');
  const futureAge = currentAge ? calculateFutureAge(currentAge) : null;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ageCardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AnimationDuration.NORMAL,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate age cards when age is calculated
  useEffect(() => {
    if (currentAge !== null) {
      Animated.spring(ageCardAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [currentAge]);

  const isValid = !!basicData.dateOfBirth;

  const handleContinue = () => {
    markScreenCompleted('basic-data');
    navigation.navigate('Selfie');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={progressPercentage} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>
            We'll use this to create your future self
          </Text>

          <View style={styles.datePickerWrapper}>
            <DatePickerField
              label=""
              value={basicData.dateOfBirth || ''}
              onChange={(date) => setBasicData({ dateOfBirth: date })}
              placeholder="Tap to select your birthday"
            />
          </View>
        </Animated.View>

        {/* Age Display - appears after date selection */}
        {currentAge !== null && (
          <Animated.View
            style={[
              styles.ageDisplayContainer,
              {
                opacity: ageCardAnim,
                transform: [
                  {
                    scale: ageCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.ageCard}>
              <Text style={styles.ageLabel}>You are</Text>
              <Text style={styles.ageValue}>{currentAge}</Text>
              <Text style={styles.ageUnit}>years old</Text>
            </View>
            <View style={styles.ageArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
            <View style={[styles.ageCard, styles.futureAgeCard]}>
              <Text style={styles.ageLabel}>Future You is</Text>
              <Text style={[styles.ageValue, styles.futureAgeValue]}>{futureAge}</Text>
              <Text style={[styles.ageUnit, styles.futureAgeUnit]}>years old</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        disabled={!isValid}
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 32,
  },
  datePickerWrapper: {
    width: '100%',
    maxWidth: 300,
  },
  ageDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageCard: {
    backgroundColor: '#21262D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 130,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  futureAgeCard: {
    backgroundColor: '#1B4F28',
    borderColor: '#238636',
  },
  ageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B949E',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  futureAgeValue: {
    color: '#7EE787',
  },
  ageUnit: {
    fontSize: 12,
    color: '#6E7681',
    marginTop: 2,
  },
  futureAgeUnit: {
    color: '#56D364',
  },
  ageArrow: {
    paddingHorizontal: 20,
  },
  arrowText: {
    fontSize: 28,
    color: '#58A6FF',
  },
});
