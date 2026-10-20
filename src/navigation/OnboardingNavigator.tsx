/**
 * OnboardingNavigator
 * Nested stack navigator for the First Principle Thinking onboarding flow
 *
 * Flow: Hero → JourneyIntro → AuthChoice → BasicData →
 *       Chapters (pickIdentity → yourWorld → yourPatterns) → PatternsTransition →
 *       Chapters (innerWorld) → FutureTransition →
 *       Chapters (yourFuture → become) → FutureDesign (Beliefs+Behaviors) → Signup
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../context/OnboardingContext';
import {
  HeroScreen,
  JourneyIntroScreen,
  AuthChoiceScreen,
  LoginScreen,
  BasicDataScreen,
  SelfieScreen,
  OnboardingChapterScreen,
  PatternsTransitionScreen,
  FutureTransitionScreen,
  FutureDesignScreen,
  SignupScreen,
} from '../screens/onboarding';
import { ChapterId } from '../types/Onboarding';

export type OnboardingStackParamList = {
  Hero: undefined;
  JourneyIntro: undefined;
  AuthChoice: undefined;
  Login: undefined;
  BasicData: undefined;
  Selfie: undefined;
  OnboardingChapter: { chapter: ChapterId };
  PatternsTransition: undefined;
  FutureTransition: undefined;
  FutureDesign: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#0F1419',
          },
        }}
      >
        <Stack.Screen name="Hero" component={HeroScreen} />
        <Stack.Screen name="JourneyIntro" component={JourneyIntroScreen} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="BasicData" component={BasicDataScreen} />
        <Stack.Screen name="Selfie" component={SelfieScreen} />
        <Stack.Screen name="OnboardingChapter" component={OnboardingChapterScreen} />
        <Stack.Screen name="PatternsTransition" component={PatternsTransitionScreen} />
        <Stack.Screen name="FutureTransition" component={FutureTransitionScreen} />
        <Stack.Screen name="FutureDesign" component={FutureDesignScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
};
