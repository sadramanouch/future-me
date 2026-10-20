/**
 * Onboarding Types
 * Built on First Principle Thinking framework:
 * Vision / 2 Identities / 2 Behaviors / 2 Beliefs
 *
 * "To get what you want, you need to become the version of you who has it"
 */

// Basic Demographics collected across BasicDataScreen and SignupScreen
export interface BasicDemographics {
  name?: string; // Collected at signup
  dateOfBirth: string; // ISO date string - collected in BasicDataScreen
  location?: string;
  ethnicity?: string;
  gender?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
}

// Current State Profile - "Start from where you are"
export interface CurrentStateProfile {
  foundation: {
    values: string; // Freeform: core values
    selectedValues: string[]; // Chip-selected values
    loveTo: string; // "I love to..." statements - what energizes them
    principles: string; // Rules they live by, non-negotiables
  };
  identity: {
    occupation: string;
    selfDescription: string; // Who they are in their own words
    lifeChapters: string; // Key events that shaped them (evolution of self)
    friendDescription: string; // How others see them
    traits: string[]; // Selected current attributes
  };
  patterns: {
    typicalDay: string;
    highestSelf: string; // Daimon - who they are at their best
    lowestSelf: string; // Demon - patterns when at their worst
  };
  beliefs: {
    selfBelief: string; // Belief about their ability
    selfStory: string; // Story they tell themselves
    limitingBeliefs: string; // What holds them back
  };
}

// Future Design Profile - "Become the version who has it"
export interface FutureDesignProfile {
  futureAge: number;
  yearsAhead: number;
  vision: {
    idealLife: string; // No-limits life design
    northStar: string; // The ONE ultimate goal
    specificOutcomes: string; // Precise goals
    idealDay: string; // Future day from morning to night
  };
  identity: {
    description: string; // Who the future self is
    traits: string[]; // Future self traits
    identityStatement: string; // "I am the kind of person who..."
  };
  beliefs: {
    money: string[];
    health: string[];
    relationships: string[];
    customMoney?: string[];
    customHealth?: string[];
    customRelationships?: string[];
  };
  behaviors: {
    dailyDifferences: string; // What future self does that current self doesn't
    stoppedDoing: string; // What future self let go of
  };
}

// Onboarding Progress tracking
export interface OnboardingProgress {
  id: string;
  startedAt: string;
  lastUpdatedAt: string;
  currentScreen: OnboardingScreen;
  currentChapter?: ChapterId;
  currentQuestionIndex?: number;
  completedScreens: OnboardingScreen[];

  // Collected data
  basicData: Partial<BasicDemographics>;
  currentState: Partial<CurrentStateProfile>;
  futureDesign: Partial<FutureDesignProfile>;

  // Progress stats
  totalQuestionsAnswered: number;

  // Skipped questions that can be revisited later
  skippedQuestions?: string[];
}

// Screen identifiers
export type OnboardingScreen =
  | 'hero'
  | 'journey-intro'
  | 'auth-choice'
  | 'login'
  | 'basic-data'
  | 'chapter-foundation'
  | 'chapter-presentIdentity'
  | 'chapter-presentPatterns'
  | 'chapter-presentBeliefs'
  | 'future-transition'
  | 'chapter-vision'
  | 'chapter-futureIdentity'
  | 'future-design'
  | 'signup';

// Chapter identifiers - dopamine-first ordering
export type ChapterId =
  | 'pickIdentity'     // All taps: traits + values + future traits
  | 'yourWorld'        // Easy text: occupation, loveTo, friendDescription
  | 'yourPatterns'     // Patterns: typicalDay, highestSelf, lowestSelf
  | 'innerWorld'       // Deep: selfDescription, limitingBeliefs
  | 'yourFuture'       // Exciting: idealLife, northStar, idealDay
  | 'become';          // Culmination: lifeChapters, identityStatement

// Question types
export type QuestionType =
  | 'text'
  | 'longText'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'attributeGrid'
  | 'beliefSelector';

// Question configuration
export interface QuestionConfig {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  subtitle?: string;
  required: boolean;
  options?: string[];
  allowCustom?: boolean;
  categories?: BeliefCategory[];
}

// Belief category for future design
export interface BeliefCategory {
  id: string;
  name: string;
  options: string[];
}

// Chapter configuration
export interface ChapterConfig {
  id: ChapterId;
  title: string;
  subtitle: string;
  questions: QuestionConfig[];
}

// === Predefined Options ===

export const VALUE_OPTIONS = [
  'Spiritual Alignment',
  'Self-Mastery',
  'Connection & Intimacy',
  'Joy & Play',
  'Leadership',
  'Freedom',
  'Family',
  'Health & Vitality',
  'Wealth & Abundance',
  'Discipline',
  'Creativity',
  'Growth',
  'Adventure',
  'Impact & Contribution',
  'Faith',
  'Knowledge & Wisdom',
  'Integrity',
  'Excellence',
];

export const PRESENT_TRAIT_OPTIONS = [
  'Ambitious',
  'Analytical',
  'Adventurous',
  'Calm',
  'Caring',
  'Creative',
  'Determined',
  'Empathetic',
  'Funny',
  'Loyal',
  'Patient',
  'Resilient',
  'Wise',
  'Introverted',
  'Extroverted',
  'Perfectionist',
];

export const FUTURE_TRAIT_OPTIONS = [
  'Disciplined',
  'Visionary',
  'Confident',
  'Resilient',
  'Generous',
  'Focused',
  'Grounded',
  'Bold',
  'Patient',
  'Wise',
  'Magnetic',
  'Fearless',
  'Abundant',
  'Present',
  'Powerful',
  'Free',
  'Charismatic',
  'Relentless',
];

export const MONEY_BELIEF_OPTIONS = [
  'Money flows to me easily',
  'I create massive value and am compensated accordingly',
  'Wealth allows me to help others at scale',
  'I am financially free and secure',
  'Money is a tool for creating the life I want',
  'I always have more than enough',
];

export const HEALTH_BELIEF_OPTIONS = [
  'My body is strong, capable, and energized',
  'I prioritize my energy and vitality above all',
  'Health is the foundation everything else is built on',
  'I treat my body with discipline and respect',
  'I am in the best shape of my life',
  'My mind is sharp and clear',
];

export const RELATIONSHIP_BELIEF_OPTIONS = [
  'I attract relationships that elevate me',
  'I give and receive love freely and deeply',
  'My relationships are built on radical trust',
  'I am surrounded by people who push me to grow',
  'I communicate with total honesty and compassion',
  'I set boundaries that protect my energy',
];

// Helper to calculate future age
export const calculateFutureAge = (currentAge: number): number => {
  const withFive = currentAge + 5;
  return Math.ceil(withFive / 10) * 10;
};

// Helper to get years ahead
export const calculateYearsAhead = (currentAge: number): number => {
  return calculateFutureAge(currentAge) - currentAge;
};
