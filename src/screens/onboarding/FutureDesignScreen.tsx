/**
 * FutureDesignScreen
 * Final onboarding screen: Future Beliefs + Future Behaviors
 * Captures the last 2 of the 7 sections in the First Principle framework
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  ProgressBar,
  NavigationButtons,
  ChapterHeader,
  LongTextInput,
  BeliefSelector,
} from '../../components/onboarding';
import {
  MONEY_BELIEF_OPTIONS,
  HEALTH_BELIEF_OPTIONS,
  RELATIONSHIP_BELIEF_OPTIONS,
} from '../../types/Onboarding';
import { AnimationDuration } from '../../utils/animations';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type Section = 'beliefs' | 'behaviors';

export const FutureDesignScreen: React.FC<Props> = ({ navigation }) => {
  const [section, setSection] = useState<Section>('beliefs');

  const {
    progress,
    setFutureDesignData,
    progressPercentage,
  } = useOnboarding();

  const { futureDesign } = progress;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: AnimationDuration.FAST,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AnimationDuration.FAST,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, AnimationDuration.FAST);
  };

  // Toggle belief selection
  const toggleBelief = (category: 'money' | 'health' | 'relationships', belief: string) => {
    const currentBeliefs = futureDesign.beliefs || { money: [], health: [], relationships: [] };
    const categoryBeliefs = currentBeliefs[category] || [];

    const updated = categoryBeliefs.includes(belief)
      ? categoryBeliefs.filter((b: string) => b !== belief)
      : [...categoryBeliefs, belief];

    setFutureDesignData({
      beliefs: {
        ...currentBeliefs,
        [category]: updated,
      },
    });
  };

  // Add custom belief
  const addCustomBelief = (category: 'money' | 'health' | 'relationships', belief: string) => {
    const currentBeliefs = futureDesign.beliefs || { money: [], health: [], relationships: [] };
    const customKey = `custom${category.charAt(0).toUpperCase() + category.slice(1)}` as 'customMoney' | 'customHealth' | 'customRelationships';
    const customBeliefs = currentBeliefs[customKey] || [];

    setFutureDesignData({
      beliefs: {
        ...currentBeliefs,
        [category]: [...(currentBeliefs[category] || []), belief],
        [customKey]: [...customBeliefs, belief],
      },
    });
  };

  // Update behaviors
  const setBehaviorField = (field: 'dailyDifferences' | 'stoppedDoing', value: string) => {
    const currentBehaviors = futureDesign.behaviors || { dailyDifferences: '', stoppedDoing: '' };
    setFutureDesignData({
      behaviors: {
        ...currentBehaviors,
        [field]: value,
      },
    });
  };

  const isValid = () => {
    if (section === 'behaviors') {
      return !!(futureDesign.behaviors?.dailyDifferences?.trim());
    }
    return true; // Beliefs are optional
  };

  const handleContinue = async () => {
    if (section === 'beliefs') {
      animateTransition(() => setSection('behaviors'));
    } else {
      navigation.navigate('Signup');
    }
  };

  const handleBack = () => {
    if (section === 'behaviors') {
      animateTransition(() => setSection('beliefs'));
    } else {
      navigation.goBack();
    }
  };

  const renderBeliefsSection = () => {
    const beliefs = futureDesign.beliefs || { money: [], health: [], relationships: [] };

    return (
      <>
        <ChapterHeader
          title="What does your future self believe?"
          subtitle="Select the beliefs that define who you are becoming"
        />

        <BeliefSelector
          category="Money & Wealth"
          options={MONEY_BELIEF_OPTIONS}
          selectedValues={beliefs.money || []}
          customValues={beliefs.customMoney}
          onToggle={(value) => toggleBelief('money', value)}
          onAddCustom={(value) => addCustomBelief('money', value)}
        />

        <BeliefSelector
          category="Health & Energy"
          options={HEALTH_BELIEF_OPTIONS}
          selectedValues={beliefs.health || []}
          customValues={beliefs.customHealth}
          onToggle={(value) => toggleBelief('health', value)}
          onAddCustom={(value) => addCustomBelief('health', value)}
        />

        <BeliefSelector
          category="Relationships & Connection"
          options={RELATIONSHIP_BELIEF_OPTIONS}
          selectedValues={beliefs.relationships || []}
          customValues={beliefs.customRelationships}
          onToggle={(value) => toggleBelief('relationships', value)}
          onAddCustom={(value) => addCustomBelief('relationships', value)}
        />
      </>
    );
  };

  const renderBehaviorsSection = () => {
    const behaviors = futureDesign.behaviors || { dailyDifferences: '', stoppedDoing: '' };

    return (
      <>
        <ChapterHeader
          title="What does your future self do differently?"
          subtitle="The gap between who you are and who you become is closed by daily action"
        />

        <View style={styles.questionBlock}>
          <Text style={styles.questionLabel}>
            What does your future self do daily that you don't yet?
          </Text>
          <LongTextInput
            value={behaviors.dailyDifferences || ''}
            onChangeText={(text) => setBehaviorField('dailyDifferences', text)}
            placeholder="The habits, routines, and actions that bridge the gap..."
            hint="Think about what you'd need to start doing every day to become that person"
            autoFocus
          />
        </View>

        <View style={styles.questionBlock}>
          <Text style={styles.questionLabel}>
            What did your future self stop doing or let go of to get here?
          </Text>
          <LongTextInput
            value={behaviors.stoppedDoing || ''}
            onChangeText={(text) => setBehaviorField('stoppedDoing', text)}
            placeholder="The habits, beliefs, or patterns you left behind..."
            hint="What did you have to release to make room for who you're becoming?"
          />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={progressPercentage} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {section === 'beliefs' ? renderBeliefsSection() : renderBehaviorsSection()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={section === 'behaviors' ? 'Create Account' : 'Continue'}
        disabled={!isValid()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  questionBlock: {
    marginBottom: 32,
  },
  questionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 24,
  },
});
