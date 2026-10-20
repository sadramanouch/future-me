/**
 * PROMPT 1 Implementation: Future Self Data Model
 *
 * This structured data model supports long-term consistency
 * and is reusable across conversations.
 */

export interface CoreIdentity {
  name: string;
  age: number;
  currentAge: number;
  yearsAhead: number;
  dominantTraits: string[]; // e.g., "disciplined", "introspective", "direct"
  identityStatement: string; // "I am someone who..."
}

export interface Values {
  core: string[]; // e.g., "integrity", "growth", "autonomy"
  nonNegotiables: string[]; // What you will never compromise on
  aspirational: string[]; // Values you're growing into
}

export interface CommunicationStyle {
  tone: "calm" | "direct" | "reflective" | "challenging" | "balanced";
  approach: "socratic" | "advisory" | "confrontational" | "balanced";
  useHumor: boolean;
  directnessLevel: number; // 1-10, how blunt
  empathyLevel: number; // 1-10, how much warmth
}

export interface LifePhilosophy {
  worldview: string; // Core belief about life
  purposeStatement: string;
  principlesForLiving: string[]; // Guiding principles
  viewOnSuffering: string;
  viewOnSuccess: string;
}

export interface StandardsAndBoundaries {
  personalStandards: string[]; // "I don't make excuses", "I finish what I start"
  boundaries: string[]; // What you protect
  dealBreakers: string[]; // In relationships, work, etc.
  timeProtection: string[]; // How you guard your time
}

export interface Achievement {
  area: string; // "career", "health", "relationships", "skills"
  description: string;
  dateAchieved: string; // When future self achieved this
  lessonsLearned: string[];
  sacrificesMade: string[];
  consequencesOfNotDoing: string; // What would have happened if past self didn't act
}

export interface DailyRoutine {
  morningPractices: string[];
  workHabits: string[];
  eveningPractices: string[];
  nonNegotiableHabits: string[];
  timeAllocation: {
    deepWork: number; // hours per day
    relationships: number;
    selfCare: number;
    rest: number;
  };
}

export interface RelationshipPrinciples {
  friendships: string[];
  romantic: string[];
  family: string[];
  professional: string[];
  boundariesInRelationships: string[];
}

export interface DecisionHeuristic {
  name: string;
  description: string;
  whenToUse: string;
  example: string;
}

export interface FutureSelfModel {
  id: string;
  createdAt: string;
  lastUpdated: string;

  coreIdentity: CoreIdentity;
  values: Values;
  communicationStyle: CommunicationStyle;
  lifePhilosophy: LifePhilosophy;
  standardsAndBoundaries: StandardsAndBoundaries;
  achievements: Achievement[];
  dailyRoutine: DailyRoutine;
  relationshipPrinciples: RelationshipPrinciples;
  decisionHeuristics: DecisionHeuristic[];

  // Meta
  version: number;
  isCalibrated: boolean; // Has the user validated this model?
}

/**
 * Default template for new users
 */
export const createEmptyFutureSelf = (currentAge: number, yearsAhead: number = 5): Partial<FutureSelfModel> => ({
  id: Date.now().toString(),
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  version: 1,
  isCalibrated: false,
  coreIdentity: {
    name: "",
    age: currentAge + yearsAhead,
    currentAge,
    yearsAhead,
    dominantTraits: [],
    identityStatement: "",
  },
  values: {
    core: [],
    nonNegotiables: [],
    aspirational: [],
  },
  communicationStyle: {
    tone: "balanced",
    approach: "balanced",
    useHumor: false,
    directnessLevel: 7,
    empathyLevel: 6,
  },
  achievements: [],
  decisionHeuristics: [],
});
