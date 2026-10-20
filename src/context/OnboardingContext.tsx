/**
 * Onboarding Context
 * State management for the First Principle Thinking onboarding journey
 * 7 sections: Vision / 2 Identities / 2 Behaviors / 2 Beliefs
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { StorageService } from '../services/Storage';
import {
  OnboardingProgress,
  OnboardingScreen,
  ChapterId,
  BasicDemographics,
  CurrentStateProfile,
  FutureDesignProfile,
  calculateFutureAge,
  calculateYearsAhead,
} from '../types/Onboarding';
import { FutureSelfModel, createEmptyFutureSelf } from '../types/FutureSelf';

// Total questions in the onboarding (16 across 6 chapters)
const TOTAL_QUESTIONS = 16;

// Default values for nested structures
const DEFAULT_FOUNDATION: CurrentStateProfile['foundation'] = { values: '', selectedValues: [], loveTo: '', principles: '' };
const DEFAULT_IDENTITY: CurrentStateProfile['identity'] = { occupation: '', selfDescription: '', lifeChapters: '', friendDescription: '', traits: [] };
const DEFAULT_PATTERNS: CurrentStateProfile['patterns'] = { typicalDay: '', highestSelf: '', lowestSelf: '' };
const DEFAULT_BELIEFS: CurrentStateProfile['beliefs'] = { selfBelief: '', selfStory: '', limitingBeliefs: '' };
const DEFAULT_VISION: FutureDesignProfile['vision'] = { idealLife: '', northStar: '', specificOutcomes: '', idealDay: '' };
const DEFAULT_FUTURE_IDENTITY: FutureDesignProfile['identity'] = { description: '', traits: [], identityStatement: '' };
const DEFAULT_FUTURE_BELIEFS: FutureDesignProfile['beliefs'] = { money: [], health: [], relationships: [] };
const DEFAULT_FUTURE_BEHAVIORS: FutureDesignProfile['behaviors'] = { dailyDifferences: '', stoppedDoing: '' };

interface OnboardingContextType {
  // Progress state
  progress: OnboardingProgress;
  isLoading: boolean;

  // Navigation
  currentScreen: OnboardingScreen;
  setCurrentScreen: (screen: OnboardingScreen) => void;
  markScreenCompleted: (screen: OnboardingScreen) => void;

  // Data setters
  setBasicData: (data: Partial<BasicDemographics>) => void;
  setFoundationData: (data: Partial<CurrentStateProfile['foundation']>) => void;
  setIdentityData: (data: Partial<CurrentStateProfile['identity']>) => void;
  setPatternsData: (data: Partial<CurrentStateProfile['patterns']>) => void;
  setBeliefsData: (data: Partial<CurrentStateProfile['beliefs']>) => void;
  setVisionData: (data: Partial<FutureDesignProfile['vision']>) => void;
  setFutureIdentityData: (data: Partial<FutureDesignProfile['identity']>) => void;
  setFutureDesignData: (data: Partial<FutureDesignProfile>) => void;

  // Actions
  saveProgress: () => Promise<void>;
  completeOnboarding: (finalData?: Partial<BasicDemographics>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  skipQuestion: (questionId: string) => void;

  // Computed values
  progressPercentage: number;
  questionsAnswered: number;
  futureAge: number | null;
  yearsAhead: number | null;
}

const defaultProgress: OnboardingProgress = {
  id: '',
  startedAt: '',
  lastUpdatedAt: '',
  currentScreen: 'hero',
  completedScreens: [],
  basicData: {},
  currentState: {
    foundation: DEFAULT_FOUNDATION,
    identity: DEFAULT_IDENTITY,
    patterns: DEFAULT_PATTERNS,
    beliefs: DEFAULT_BELIEFS,
  },
  futureDesign: {
    futureAge: 0,
    yearsAhead: 0,
    vision: DEFAULT_VISION,
    identity: DEFAULT_FUTURE_IDENTITY,
    beliefs: DEFAULT_FUTURE_BELIEFS,
    behaviors: DEFAULT_FUTURE_BEHAVIORS,
  },
  totalQuestionsAnswered: 0,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [progress, setProgress] = useState<OnboardingProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const saved = await StorageService.getOnboardingProgress();
      if (saved) {
        const sf = saved.currentState?.foundation;
        const si = saved.currentState?.identity;
        const sp = saved.currentState?.patterns;
        const sb = saved.currentState?.beliefs;
        const fv = saved.futureDesign?.vision;
        const fi = saved.futureDesign?.identity;
        const fb = saved.futureDesign?.beliefs;
        const fbh = saved.futureDesign?.behaviors;

        const mergedProgress: OnboardingProgress = {
          ...defaultProgress,
          ...saved,
          basicData: { ...defaultProgress.basicData, ...saved.basicData },
          currentState: {
            foundation: {
              values: (sf as any)?.values ?? DEFAULT_FOUNDATION.values,
              selectedValues: (sf as any)?.selectedValues ?? DEFAULT_FOUNDATION.selectedValues,
              loveTo: (sf as any)?.loveTo ?? DEFAULT_FOUNDATION.loveTo,
              principles: (sf as any)?.principles ?? DEFAULT_FOUNDATION.principles,
            },
            identity: {
              occupation: (si as any)?.occupation ?? DEFAULT_IDENTITY.occupation,
              selfDescription: (si as any)?.selfDescription ?? DEFAULT_IDENTITY.selfDescription,
              lifeChapters: (si as any)?.lifeChapters ?? DEFAULT_IDENTITY.lifeChapters,
              friendDescription: (si as any)?.friendDescription ?? DEFAULT_IDENTITY.friendDescription,
              traits: (si as any)?.traits ?? DEFAULT_IDENTITY.traits,
            },
            patterns: {
              typicalDay: (sp as any)?.typicalDay ?? DEFAULT_PATTERNS.typicalDay,
              highestSelf: (sp as any)?.highestSelf ?? DEFAULT_PATTERNS.highestSelf,
              lowestSelf: (sp as any)?.lowestSelf ?? DEFAULT_PATTERNS.lowestSelf,
            },
            beliefs: {
              selfBelief: (sb as any)?.selfBelief ?? DEFAULT_BELIEFS.selfBelief,
              selfStory: (sb as any)?.selfStory ?? DEFAULT_BELIEFS.selfStory,
              limitingBeliefs: (sb as any)?.limitingBeliefs ?? DEFAULT_BELIEFS.limitingBeliefs,
            },
          },
          futureDesign: {
            futureAge: saved.futureDesign?.futureAge ?? 0,
            yearsAhead: saved.futureDesign?.yearsAhead ?? 0,
            vision: {
              idealLife: (fv as any)?.idealLife ?? DEFAULT_VISION.idealLife,
              northStar: (fv as any)?.northStar ?? DEFAULT_VISION.northStar,
              specificOutcomes: (fv as any)?.specificOutcomes ?? DEFAULT_VISION.specificOutcomes,
              idealDay: (fv as any)?.idealDay ?? DEFAULT_VISION.idealDay,
            },
            identity: {
              description: (fi as any)?.description ?? DEFAULT_FUTURE_IDENTITY.description,
              traits: (fi as any)?.traits ?? DEFAULT_FUTURE_IDENTITY.traits,
              identityStatement: (fi as any)?.identityStatement ?? DEFAULT_FUTURE_IDENTITY.identityStatement,
            },
            beliefs: {
              money: (fb as any)?.money ?? DEFAULT_FUTURE_BELIEFS.money,
              health: (fb as any)?.health ?? DEFAULT_FUTURE_BELIEFS.health,
              relationships: (fb as any)?.relationships ?? DEFAULT_FUTURE_BELIEFS.relationships,
              customMoney: (fb as any)?.customMoney,
              customHealth: (fb as any)?.customHealth,
              customRelationships: (fb as any)?.customRelationships,
            },
            behaviors: {
              dailyDifferences: (fbh as any)?.dailyDifferences ?? DEFAULT_FUTURE_BEHAVIORS.dailyDifferences,
              stoppedDoing: (fbh as any)?.stoppedDoing ?? DEFAULT_FUTURE_BEHAVIORS.stoppedDoing,
            },
          },
        };
        setProgress(mergedProgress);
      } else {
        const newProgress: OnboardingProgress = {
          ...defaultProgress,
          id: Date.now().toString(),
          startedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current age from DOB
  const getCurrentAge = useCallback((): number | null => {
    if (!progress.basicData.dateOfBirth) return null;
    const dob = new Date(progress.basicData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }, [progress.basicData.dateOfBirth]);

  const futureAge = getCurrentAge() !== null ? calculateFutureAge(getCurrentAge()!) : null;
  const yearsAhead = getCurrentAge() !== null ? calculateYearsAhead(getCurrentAge()!) : null;

  // Count answered questions (16 across 6 chapters)
  const countQuestionsAnswered = useCallback((): number => {
    let count = 0;

    // Ch1: Pick Identity (3 tap-based questions)
    if (progress.currentState.identity?.traits?.length) count++;
    if (progress.currentState.foundation?.selectedValues?.length) count++;
    if (progress.futureDesign.identity?.traits?.length) count++;

    // Ch2: Your World (3 questions)
    if (progress.currentState.identity?.occupation) count++;
    if (progress.currentState.foundation?.loveTo) count++;
    if (progress.currentState.identity?.friendDescription) count++;

    // Ch3: Your Patterns (3 questions)
    if (progress.currentState.patterns?.typicalDay) count++;
    if (progress.currentState.patterns?.highestSelf) count++;
    if (progress.currentState.patterns?.lowestSelf) count++;

    // Ch4: Inner World (2 questions)
    if (progress.currentState.identity?.selfDescription) count++;
    if (progress.currentState.beliefs?.limitingBeliefs) count++;

    // Ch5: Your Future (3 questions)
    if (progress.futureDesign.vision?.idealLife) count++;
    if (progress.futureDesign.vision?.northStar) count++;
    if (progress.futureDesign.vision?.idealDay) count++;

    // Ch6: Become (2 questions)
    if (progress.currentState.identity?.lifeChapters) count++;
    if (progress.futureDesign.identity?.identityStatement) count++;

    return count;
  }, [progress]);

  const questionsAnswered = countQuestionsAnswered();
  const progressPercentage = Math.round((questionsAnswered / TOTAL_QUESTIONS) * 100);

  const setCurrentScreen = useCallback((screen: OnboardingScreen) => {
    setProgress((prev) => ({
      ...prev,
      currentScreen: screen,
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const markScreenCompleted = useCallback((screen: OnboardingScreen) => {
    setProgress((prev) => ({
      ...prev,
      completedScreens: prev.completedScreens.includes(screen)
        ? prev.completedScreens
        : [...prev.completedScreens, screen],
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setBasicData = useCallback((data: Partial<BasicDemographics>) => {
    setProgress((prev) => ({
      ...prev,
      basicData: { ...prev.basicData, ...data },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setFoundationData = useCallback((data: Partial<CurrentStateProfile['foundation']>) => {
    setProgress((prev) => ({
      ...prev,
      currentState: {
        ...prev.currentState,
        foundation: { ...prev.currentState.foundation, ...data } as CurrentStateProfile['foundation'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setIdentityData = useCallback((data: Partial<CurrentStateProfile['identity']>) => {
    setProgress((prev) => ({
      ...prev,
      currentState: {
        ...prev.currentState,
        identity: { ...prev.currentState.identity, ...data } as CurrentStateProfile['identity'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setPatternsData = useCallback((data: Partial<CurrentStateProfile['patterns']>) => {
    setProgress((prev) => ({
      ...prev,
      currentState: {
        ...prev.currentState,
        patterns: { ...prev.currentState.patterns, ...data } as CurrentStateProfile['patterns'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setBeliefsData = useCallback((data: Partial<CurrentStateProfile['beliefs']>) => {
    setProgress((prev) => ({
      ...prev,
      currentState: {
        ...prev.currentState,
        beliefs: { ...prev.currentState.beliefs, ...data } as CurrentStateProfile['beliefs'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setVisionData = useCallback((data: Partial<FutureDesignProfile['vision']>) => {
    setProgress((prev) => ({
      ...prev,
      futureDesign: {
        ...prev.futureDesign,
        vision: { ...prev.futureDesign.vision, ...data } as FutureDesignProfile['vision'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setFutureIdentityData = useCallback((data: Partial<FutureDesignProfile['identity']>) => {
    setProgress((prev) => ({
      ...prev,
      futureDesign: {
        ...prev.futureDesign,
        identity: { ...prev.futureDesign.identity, ...data } as FutureDesignProfile['identity'],
      },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const setFutureDesignData = useCallback((data: Partial<FutureDesignProfile>) => {
    setProgress((prev) => ({
      ...prev,
      futureDesign: { ...prev.futureDesign, ...data },
      lastUpdatedAt: new Date().toISOString(),
    }));
  }, []);

  const saveProgress = useCallback(async () => {
    try {
      const updatedProgress = {
        ...progress,
        totalQuestionsAnswered: countQuestionsAnswered(),
        lastUpdatedAt: new Date().toISOString(),
      };
      await StorageService.saveOnboardingProgress(updatedProgress);
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }, [progress, countQuestionsAnswered]);

  // Auto-save on progress changes
  useEffect(() => {
    if (!isLoading && progress.id) {
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [progress, isLoading]);

  const completeOnboarding = useCallback(async (finalData?: Partial<BasicDemographics>) => {
    try {
      const currentAge = getCurrentAge();
      const mergedBasicData = { ...progress.basicData, ...finalData };

      if (!currentAge) {
        throw new Error('Date of birth is required');
      }

      if (!mergedBasicData.name) {
        throw new Error('Name is required');
      }

      const calculatedFutureAge = calculateFutureAge(currentAge);
      const calculatedYearsAhead = calculateYearsAhead(currentAge);

      // Build FutureSelfModel from the 7-section onboarding data
      const cs = progress.currentState;
      const fd = progress.futureDesign;

      const futureSelf: FutureSelfModel = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: 3,
        isCalibrated: true,

        coreIdentity: {
          name: mergedBasicData.name || '',
          age: calculatedFutureAge,
          currentAge,
          yearsAhead: calculatedYearsAhead,
          // Future self traits define who they become
          dominantTraits: fd.identity?.traits || [],
          // Future self identity statement
          identityStatement: fd.identity?.identityStatement || fd.identity?.description || '',
        },

        values: {
          core: cs.foundation?.selectedValues || [],
          nonNegotiables: cs.foundation?.principles ? [cs.foundation.principles] : [],
          aspirational: [],
        },

        communicationStyle: {
          tone: 'balanced',
          approach: 'balanced',
          useHumor: false,
          directnessLevel: 7,
          empathyLevel: 7,
        },

        lifePhilosophy: {
          // Vision becomes the purpose
          worldview: fd.vision?.idealLife || '',
          purposeStatement: cs.foundation?.values || '',
          principlesForLiving: [
            ...(fd.beliefs?.money || []),
            ...(fd.beliefs?.health || []),
            ...(fd.beliefs?.relationships || []),
          ],
          viewOnSuffering: cs.beliefs?.limitingBeliefs
            ? `I remember those limiting beliefs: "${cs.beliefs.limitingBeliefs}" -- I had to let them go.`
            : '',
          viewOnSuccess: fd.vision?.specificOutcomes || '',
        },

        standardsAndBoundaries: {
          personalStandards: cs.foundation?.principles ? [cs.foundation.principles] : [],
          boundaries: [],
          dealBreakers: [],
          timeProtection: [],
        },

        achievements: [],

        dailyRoutine: {
          morningPractices: [],
          workHabits: [],
          eveningPractices: [],
          nonNegotiableHabits: fd.behaviors?.dailyDifferences ? [fd.behaviors.dailyDifferences] : [],
          timeAllocation: {
            deepWork: 4,
            relationships: 3,
            selfCare: 2,
            rest: 8,
          },
        },

        relationshipPrinciples: {
          friendships: [],
          romantic: [],
          family: [],
          professional: [],
          boundariesInRelationships: [],
        },

        decisionHeuristics: [],
      };

      // Save the completed profile
      await StorageService.saveImmutableMemory(futureSelf);

      // Also save the raw onboarding data for richer prompt context
      await StorageService.saveOnboardingProfile({
        basicData: mergedBasicData,
        currentState: cs,
        futureDesign: fd,
      });

      // Clear onboarding progress
      await StorageService.clearOnboardingProgress();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }, [progress, getCurrentAge]);

  const skipQuestion = useCallback((questionId: string) => {
    setProgress((prev) => {
      const existing = prev.skippedQuestions || [];
      if (existing.includes(questionId)) return prev;
      return {
        ...prev,
        skippedQuestions: [...existing, questionId],
        lastUpdatedAt: new Date().toISOString(),
      };
    });
    StorageService.addSkippedQuestion(questionId);
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await StorageService.clearOnboardingProgress();
      const newProgress: OnboardingProgress = {
        ...defaultProgress,
        id: Date.now().toString(),
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
      setProgress(newProgress);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, []);

  const value: OnboardingContextType = {
    progress,
    isLoading,
    currentScreen: progress.currentScreen,
    setCurrentScreen,
    markScreenCompleted,
    setBasicData,
    setFoundationData,
    setIdentityData,
    setPatternsData,
    setBeliefsData,
    setVisionData,
    setFutureIdentityData,
    setFutureDesignData,
    saveProgress,
    completeOnboarding,
    resetOnboarding,
    skipQuestion,
    progressPercentage,
    questionsAnswered,
    futureAge,
    yearsAhead,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
