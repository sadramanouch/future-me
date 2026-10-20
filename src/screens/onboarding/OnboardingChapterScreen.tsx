/**
 * OnboardingChapterScreen
 * Dopamine-first onboarding: taps before typing, easy before deep.
 * 16 questions across 6 chapters, front-loaded with selection-based interactions.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnboardingContext';
import {
  ProgressBar,
  NavigationButtons,
  ChapterHeader,
  LongTextInput,
  TextInputField,
  MultiSelectChips,
  AttributeGrid,
} from '../../components/onboarding';
import {
  ChapterId,
  VALUE_OPTIONS,
  PRESENT_TRAIT_OPTIONS,
  FUTURE_TRAIT_OPTIONS,
} from '../../types/Onboarding';
import { AnimationDuration } from '../../utils/animations';
import { hapticSuccess } from '../../utils/haptics';

type RootStackParamList = {
  OnboardingChapter: { chapter: ChapterId };
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<RootStackParamList, 'OnboardingChapter'>;
};

// Data section identifiers for question-level routing
type DataSection = 'foundation' | 'identity' | 'patterns' | 'beliefs' | 'vision' | 'futureIdentity';

interface QuestionDef {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  dataSection: DataSection;
  dataKey?: string; // Override key if different from id
  minWords?: number; // Minimum word count for text inputs
  whyHint?: string; // Explains how this answer shapes the AI
}

// === CHAPTER QUESTIONS — ordered by dopamine (taps first, typing later) ===
const CHAPTER_QUESTIONS: Record<ChapterId, QuestionDef[]> = {
  // Chapter 1: ALL TAPS — feels like building a game character
  pickIdentity: [
    {
      id: 'traits',
      type: 'attributeGrid',
      title: 'Tap the traits that are YOU',
      subtitle: 'Be real. Not aspirational. Who are you today?',
      dataSection: 'identity',
      whyHint: 'Your future self uses these to understand where you\'re starting from -- so they know which traits to reinforce.',
    },
    {
      id: 'selectedValues',
      type: 'multiSelect',
      title: 'What drives you?',
      subtitle: 'Pick everything that resonates.',
      dataSection: 'foundation',
      whyHint: 'These become your future self\'s compass. Every response will be filtered through these values.',
    },
    {
      id: 'traits',
      type: 'futureAttributeGrid',
      title: 'Now pick who you\'re BECOMING',
      subtitle: 'The version of you that has everything you want.',
      dataSection: 'futureIdentity',
      whyHint: 'This is who your future self IS. These traits define their personality and what they hold you accountable to.',
    },
  ],

  // Chapter 2: Easy text + fun prompts
  yourWorld: [
    {
      id: 'occupation',
      type: 'text',
      title: 'What do you do?',
      subtitle: 'Job, school, your main thing right now.',
      dataSection: 'identity',
      whyHint: 'Your future self needs context. They\'ll reference your work when giving advice that fits your reality.',
    },
    {
      id: 'loveTo',
      type: 'longText',
      title: 'I love to...',
      subtitle: 'What lights you up? List as many as you want.',
      dataSection: 'foundation',
      minWords: 5,
      whyHint: 'This tells your future self what energizes you -- so they can steer you toward more of it when you\'re stuck.',
    },
    {
      id: 'friendDescription',
      type: 'longText',
      title: 'How would your best friend describe you?',
      subtitle: 'Not how you see yourself — how they see you.',
      dataSection: 'identity',
      minWords: 8,
      whyHint: 'Your future self sees you through this lens too. It helps them mirror back who you already are.',
    },
  ],

  // Chapter 3: Getting real
  yourPatterns: [
    {
      id: 'typicalDay',
      type: 'longText',
      title: 'Walk me through your day',
      subtitle: 'Morning to night. Be honest.',
      dataSection: 'patterns',
      minWords: 15,
      whyHint: 'Your future self compares your current routine against the life you designed. They\'ll spot gaps you can\'t see yet.',
    },
    {
      id: 'highestSelf',
      type: 'longText',
      title: 'Your best self — what does that look like?',
      subtitle: 'When everything clicks. What are you doing? How does it feel?',
      dataSection: 'patterns',
      minWords: 10,
      whyHint: 'This is the standard your future self celebrates. When you show up like this, they\'ll recognize it.',
    },
    {
      id: 'lowestSelf',
      type: 'longText',
      title: 'Your worst self — what shows up?',
      subtitle: 'Triggers, habits, the version you\'re not proud of. Name it.',
      dataSection: 'patterns',
      minWords: 10,
      whyHint: 'Your future self watches for these patterns and calls them out with love. They\'ve been through this.',
    },
  ],

  // Chapter 4: Deep but they're invested now
  innerWorld: [
    {
      id: 'selfDescription',
      type: 'longText',
      title: 'Who are you, really?',
      subtitle: 'Not your title. Not your role. The real answer.',
      dataSection: 'identity',
      minWords: 15,
      whyHint: 'This becomes the emotional core of your future self. They\'ll speak from the place of someone who deeply knows you.',
    },
    {
      id: 'limitingBeliefs',
      type: 'longText',
      title: 'What beliefs hold you back?',
      subtitle: 'The thoughts on repeat that keep you stuck.',
      dataSection: 'beliefs',
      minWords: 8,
      whyHint: 'Your future self broke free of these exact beliefs. They\'ll challenge them directly when they hear you repeating them.',
    },
  ],

  // Chapter 5: Exciting, forward-looking
  yourFuture: [
    {
      id: 'idealLife',
      type: 'longText',
      title: 'Design your life with zero limits',
      subtitle: 'If anything was possible — what does it look like?',
      dataSection: 'vision',
      minWords: 15,
      whyHint: 'This becomes the world your future self lives in. They\'ll describe their life using your words.',
    },
    {
      id: 'northStar',
      type: 'longText',
      title: 'What\'s your North Star?',
      subtitle: 'The ONE thing you\'re building toward.',
      dataSection: 'vision',
      minWords: 5,
      whyHint: 'Every conversation circles back to this. Your future self measures your decisions against this one goal.',
    },
    {
      id: 'idealDay',
      type: 'longText',
      title: '', // Dynamically set with future age
      subtitle: 'Morning to night. Paint the full picture.',
      dataSection: 'vision',
      minWords: 20,
      whyHint: 'This is the day your future self actually lives. They\'ll reference it to show you what\'s ahead.',
    },
  ],

  // Chapter 6: Culmination
  become: [
    {
      id: 'lifeChapters',
      type: 'longText',
      title: 'What shaped you?',
      subtitle: 'Key chapters, struggles, and breakthroughs that made you who you are.',
      dataSection: 'identity',
      minWords: 15,
      whyHint: 'Your future self carries these memories. They\'ll reference your struggles and breakthroughs to show you how far you\'ve come.',
    },
    {
      id: 'identityStatement',
      type: 'longText',
      title: '"I am the kind of person who..."',
      subtitle: 'Finish this as your future self. This becomes who they are.',
      dataSection: 'futureIdentity',
      minWords: 8,
      whyHint: 'This becomes your future self\'s identity statement -- the literal words they use to define who they are.',
    },
  ],
};

type ChapterInfoMap = Record<ChapterId, { title: string; nextChapter: ChapterId | null; nextScreen: string | null }>;

const CHAPTER_INFO: ChapterInfoMap = {
  pickIdentity: { title: 'Your Identity', nextChapter: 'yourWorld', nextScreen: null },
  yourWorld: { title: 'Your World', nextChapter: 'yourPatterns', nextScreen: null },
  yourPatterns: { title: 'Your Patterns', nextChapter: null, nextScreen: 'PatternsTransition' },
  innerWorld: { title: 'Your Inner World', nextChapter: null, nextScreen: 'FutureTransition' },
  yourFuture: { title: 'Your Future', nextChapter: 'become', nextScreen: null },
  become: { title: 'Become', nextChapter: null, nextScreen: 'FutureDesign' },
};

export const OnboardingChapterScreen: React.FC<Props> = ({ navigation, route }) => {
  const chapter = route.params?.chapter;
  const isValidChapter = chapter && CHAPTER_QUESTIONS[chapter] && CHAPTER_INFO[chapter];
  const safeChapter = isValidChapter ? chapter : 'pickIdentity';
  const questions = CHAPTER_QUESTIONS[safeChapter];
  const chapterInfo = CHAPTER_INFO[safeChapter];

  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    setQuestionIndex(0);
  }, [safeChapter]);

  const safeQuestionIndex = Math.min(questionIndex, questions.length - 1);
  const currentQuestion = questions[safeQuestionIndex] || questions[0];

  const {
    progress,
    setFoundationData,
    setIdentityData,
    setPatternsData,
    setBeliefsData,
    setVisionData,
    setFutureIdentityData,
    progressPercentage,
    markScreenCompleted,
    skipQuestion,
    futureAge,
  } = useOnboarding();

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

  // Question-level data routing — reads from correct section regardless of chapter
  const getQuestionData = (): Record<string, any> => {
    const cs = progress?.currentState || {};
    const fd = progress?.futureDesign || {};

    switch (currentQuestion.dataSection) {
      case 'foundation':
        return (cs as any).foundation || { values: '', selectedValues: [], loveTo: '', principles: '' };
      case 'identity':
        return (cs as any).identity || { occupation: '', selfDescription: '', lifeChapters: '', friendDescription: '', traits: [] };
      case 'patterns':
        return (cs as any).patterns || { typicalDay: '', highestSelf: '', lowestSelf: '' };
      case 'beliefs':
        return (cs as any).beliefs || { selfBelief: '', selfStory: '', limitingBeliefs: '' };
      case 'vision':
        return (fd as any).vision || { idealLife: '', northStar: '', specificOutcomes: '', idealDay: '' };
      case 'futureIdentity':
        return (fd as any).identity || { description: '', traits: [], identityStatement: '' };
      default:
        return {};
    }
  };

  // Question-level setter — writes to correct section regardless of chapter
  const setQuestionSectionData = (data: any) => {
    if (!data) return;
    switch (currentQuestion.dataSection) {
      case 'foundation':
        setFoundationData(data);
        break;
      case 'identity':
        setIdentityData(data);
        break;
      case 'patterns':
        setPatternsData(data);
        break;
      case 'beliefs':
        setBeliefsData(data);
        break;
      case 'vision':
        setVisionData(data);
        break;
      case 'futureIdentity':
        setFutureIdentityData(data);
        break;
    }
  };

  const data = getQuestionData();

  const toggleArrayValue = (key: string, value: string) => {
    const current = (data as any)[key] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setQuestionSectionData({ [key]: updated });
  };

  const countWords = (text: any): number => {
    if (typeof text !== 'string' || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const requiredWords = currentQuestion.minWords || 0;
  const currentWordCount = (currentQuestion.type === 'longText' || currentQuestion.type === 'text')
    ? countWords((data as any)[currentQuestion.id])
    : 0;

  const isCurrentValid = () => {
    const value = (data as any)[currentQuestion.id];
    switch (currentQuestion.type) {
      case 'longText':
        if (!value?.trim()) return false;
        if (requiredWords > 0 && currentWordCount < requiredWords) return false;
        return true;
      case 'text':
        return !!value?.trim();
      case 'multiSelect':
      case 'attributeGrid':
      case 'futureAttributeGrid':
        return true; // Optional — taps always valid
      default:
        return true;
    }
  };

  const handleSkipQuestion = () => {
    skipQuestion(currentQuestion.id);
    if (safeQuestionIndex < questions.length - 1) {
      animateTransition(() => setQuestionIndex(safeQuestionIndex + 1));
    } else {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (safeQuestionIndex < questions.length - 1) {
      animateTransition(() => setQuestionIndex(safeQuestionIndex + 1));
    } else {
      hapticSuccess();
      markScreenCompleted(`chapter-${safeChapter}` as any);
      if (chapterInfo.nextChapter) {
        navigation.navigate('OnboardingChapter', { chapter: chapterInfo.nextChapter });
      } else if (chapterInfo.nextScreen) {
        navigation.navigate(chapterInfo.nextScreen);
      }
    }
  };

  const handleBack = () => {
    if (safeQuestionIndex > 0) {
      animateTransition(() => setQuestionIndex(safeQuestionIndex - 1));
    } else {
      navigation.goBack();
    }
  };

  // Dynamic title for idealDay question
  const getQuestionTitle = () => {
    if (currentQuestion.id === 'idealDay' && currentQuestion.dataSection === 'vision') {
      return `Your perfect day at age ${futureAge || 35}`;
    }
    return currentQuestion.title;
  };

  const renderWordCounter = () => {
    if (!requiredWords || currentQuestion.type !== 'longText') return null;
    const met = currentWordCount >= requiredWords;
    return (
      <Text style={[styles.wordCounter, met && styles.wordCounterMet]}>
        {currentWordCount} / {requiredWords} words {met ? '' : 'minimum'}
      </Text>
    );
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'longText':
        return (
          <View>
            <LongTextInput
              value={(data as any)[currentQuestion.id] || ''}
              onChangeText={(text) => setQuestionSectionData({ [currentQuestion.id]: text })}
              placeholder="Share your thoughts..."
              autoFocus
            />
            {renderWordCounter()}
            <TouchableOpacity onPress={handleSkipQuestion} style={styles.skipLink}>
              <Text style={styles.skipLinkText}>Skip for now →</Text>
            </TouchableOpacity>
          </View>
        );

      case 'text':
        return (
          <TextInputField
            value={(data as any)[currentQuestion.id] || ''}
            onChangeText={(text) => setQuestionSectionData({ [currentQuestion.id]: text })}
            placeholder="Your answer..."
            autoFocus
          />
        );

      case 'multiSelect':
        return (
          <MultiSelectChips
            options={VALUE_OPTIONS}
            selectedValues={(data as any).selectedValues || []}
            onToggle={(value) => toggleArrayValue('selectedValues', value)}
          />
        );

      case 'attributeGrid':
        return (
          <AttributeGrid
            options={PRESENT_TRAIT_OPTIONS}
            selectedValues={(data as any).traits || []}
            onToggle={(value) => toggleArrayValue('traits', value)}
            columns={3}
          />
        );

      case 'futureAttributeGrid':
        return (
          <AttributeGrid
            options={FUTURE_TRAIT_OPTIONS}
            selectedValues={(data as any).traits || []}
            onToggle={(value) => toggleArrayValue('traits', value)}
            columns={3}
          />
        );

      default:
        return null;
    }
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
            <ChapterHeader
              title={getQuestionTitle()}
              subtitle={currentQuestion.subtitle}
              whyHint={currentQuestion.whyHint}
              questionNumber={safeQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            {renderQuestion()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <NavigationButtons
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={safeQuestionIndex === questions.length - 1 ? 'Next Section' : 'Continue'}
        disabled={!isCurrentValid()}
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
  wordCounter: {
    fontSize: 13,
    color: '#6E7681',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 8,
  },
  wordCounterMet: {
    color: '#238636',
  },
  skipLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  skipLinkText: {
    fontSize: 13,
    color: '#58A6FF',
    fontWeight: '500',
  },
});
