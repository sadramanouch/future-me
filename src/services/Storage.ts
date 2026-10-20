/**
 * Storage Service - Local persistence using AsyncStorage
 * Implements the four-layer memory architecture
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FutureSelfModel,
  ImmutableIdentityMemory,
  LongTermVisionMemory,
  ConversationSession,
  ReflectionSummary,
  MemoryArchitecture,
  VisionMemoryEntry,
  StreakData,
  TrackedGoal,
  QueuedMessage,
  WeeklyDigest,
  DailyChallenge,
} from '../types';
import { OnboardingProgress } from '../types/Onboarding';

const KEYS = {
  IMMUTABLE_MEMORY: '@future_you:immutable_memory',
  LONG_TERM_MEMORY: '@future_you:long_term_memory',
  CURRENT_SESSION: '@future_you:current_session',
  REFLECTIONS: '@future_you:reflections',
  SESSIONS_HISTORY: '@future_you:sessions_history',
  ONBOARDING_PROGRESS: '@future_you:onboarding_progress',
  ONBOARDING_PROFILE: '@future_you:onboarding_profile',
  OPENING_MESSAGE: '@future_you:opening_message',
  STREAK_DATA: '@future_you:streak_data',
  MESSAGE_QUEUE: '@future_you:message_queue',
  WEEKLY_DIGESTS: '@future_you:weekly_digests',
  DAILY_CHALLENGE: '@future_you:daily_challenge',
  CHALLENGE_HISTORY: '@future_you:challenge_history',
  NOTIFICATION_SETTINGS: '@future_you:notification_settings',
  SKIPPED_QUESTIONS: '@future_you:skipped_questions',
  PAYMENT_STATUS: '@future_you:payment_status',
};

export class StorageService {
  // ============= LAYER 1: IMMUTABLE IDENTITY =============

  static async saveImmutableMemory(futureSelf: FutureSelfModel): Promise<void> {
    const immutable: ImmutableIdentityMemory = {
      futureSelf,
      lastCalibrationDate: new Date().toISOString(),
      calibrationCount: await this.getCalibrationCount() + 1,
    };
    await AsyncStorage.setItem(KEYS.IMMUTABLE_MEMORY, JSON.stringify(immutable));
  }

  static async getImmutableMemory(): Promise<ImmutableIdentityMemory | null> {
    const data = await AsyncStorage.getItem(KEYS.IMMUTABLE_MEMORY);
    return data ? JSON.parse(data) : null;
  }

  static async getFutureSelf(): Promise<FutureSelfModel | null> {
    const immutable = await this.getImmutableMemory();
    return immutable?.futureSelf || null;
  }

  private static async getCalibrationCount(): Promise<number> {
    const immutable = await this.getImmutableMemory();
    return immutable?.calibrationCount || 0;
  }

  // ============= LAYER 2: LONG-TERM VISION =============

  static async getLongTermMemory(): Promise<LongTermVisionMemory> {
    const data = await AsyncStorage.getItem(KEYS.LONG_TERM_MEMORY);
    if (data) {
      return JSON.parse(data);
    }

    // Initialize empty long-term memory
    const empty: LongTermVisionMemory = {
      entries: [],
      recurringPatterns: [],
      emergingGrowth: [],
      goalsInProgress: [],
      trackedGoals: [],
      lastUpdated: new Date().toISOString(),
    };
    return empty;
  }

  static async updateLongTermMemory(update: Partial<LongTermVisionMemory>): Promise<void> {
    const current = await this.getLongTermMemory();
    const updated: LongTermVisionMemory = {
      ...current,
      ...update,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.LONG_TERM_MEMORY, JSON.stringify(updated));
  }

  static async addVisionEntry(entry: Omit<VisionMemoryEntry, 'id'>): Promise<void> {
    const memory = await this.getLongTermMemory();
    const newEntry: VisionMemoryEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    memory.entries.push(newEntry);
    await this.updateLongTermMemory({ entries: memory.entries });
  }

  static async updateRecurringPatterns(patterns: string[]): Promise<void> {
    await this.updateLongTermMemory({ recurringPatterns: patterns });
  }

  // ============= LAYER 3: SHORT-TERM CONVERSATIONAL =============

  static async getCurrentSession(): Promise<ConversationSession | null> {
    const data = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  }

  static async startNewSession(): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: Date.now().toString(),
      startedAt: new Date().toISOString(),
      messages: [],
      context: {},
      wasReflectionGenerated: false,
    };
    await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    return session;
  }

  static async addMessageToSession(role: 'user' | 'assistant', content: string): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('No active session');

    const message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    session.messages.push(message);
    await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  static async endSession(): Promise<ConversationSession> {
    const session = await this.getCurrentSession();
    if (!session) throw new Error('No active session');

    session.endedAt = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));

    // Archive to history
    await this.archiveSession(session);

    return session;
  }

  private static async archiveSession(session: ConversationSession): Promise<void> {
    const historyData = await AsyncStorage.getItem(KEYS.SESSIONS_HISTORY);
    const history: ConversationSession[] = historyData ? JSON.parse(historyData) : [];
    history.push(session);

    // Keep only last 50 sessions
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    await AsyncStorage.setItem(KEYS.SESSIONS_HISTORY, JSON.stringify(history));
  }

  static async getSessionsHistory(): Promise<ConversationSession[]> {
    const data = await AsyncStorage.getItem(KEYS.SESSIONS_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  // ============= LAYER 4: REFLECTIONS =============

  static async saveReflection(reflection: ReflectionSummary): Promise<void> {
    const reflections = await this.getReflections();
    reflections.push(reflection);

    // Keep only last 30 reflections
    if (reflections.length > 30) {
      reflections.splice(0, reflections.length - 30);
    }

    await AsyncStorage.setItem(KEYS.REFLECTIONS, JSON.stringify(reflections));
  }

  static async getReflections(): Promise<ReflectionSummary[]> {
    const data = await AsyncStorage.getItem(KEYS.REFLECTIONS);
    return data ? JSON.parse(data) : [];
  }

  static async getRecentReflections(count: number = 5): Promise<ReflectionSummary[]> {
    const reflections = await this.getReflections();
    return reflections.slice(-count);
  }

  // ============= COMPLETE MEMORY ARCHITECTURE =============

  static async getCompleteMemory(): Promise<MemoryArchitecture | null> {
    const immutable = await this.getImmutableMemory();
    if (!immutable) return null;

    const longTerm = await this.getLongTermMemory();
    const currentSession = await this.getCurrentSession();
    const reflections = await this.getReflections();

    return {
      immutable,
      longTerm,
      currentSession,
      reflections,
    };
  }

  // ============= ONBOARDING PROGRESS =============

  static async saveOnboardingProgress(progress: OnboardingProgress): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_PROGRESS, JSON.stringify(progress));
  }

  static async getOnboardingProgress(): Promise<OnboardingProgress | null> {
    const data = await AsyncStorage.getItem(KEYS.ONBOARDING_PROGRESS);
    return data ? JSON.parse(data) : null;
  }

  static async clearOnboardingProgress(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.ONBOARDING_PROGRESS);
  }

  static async hasOnboardingInProgress(): Promise<boolean> {
    const progress = await this.getOnboardingProgress();
    return progress !== null;
  }

  // ============= ONBOARDING PROFILE (RAW DATA) =============

  static async saveOnboardingProfile(profile: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_PROFILE, JSON.stringify(profile));
  }

  static async getOnboardingProfile(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.ONBOARDING_PROFILE);
    return data ? JSON.parse(data) : null;
  }

  // ============= OPENING MESSAGE =============

  static async saveOpeningMessage(message: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.OPENING_MESSAGE, message);
  }

  static async getOpeningMessage(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.OPENING_MESSAGE);
  }

  // ============= SESSION MOOD =============

  static async updateSessionMood(mood: string): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session) return;
    session.context.userMood = mood as any;
    await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  }

  // ============= STREAK TRACKING =============

  static async getStreakData(): Promise<StreakData> {
    const data = await AsyncStorage.getItem(KEYS.STREAK_DATA);
    if (data) return JSON.parse(data);
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalDays: 0 };
  }

  static async updateStreak(): Promise<StreakData> {
    const streak = await this.getStreakData();
    const today = new Date().toISOString().split('T')[0];

    if (streak.lastActiveDate === today) return streak; // Already counted today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streak.lastActiveDate === yesterday) {
      streak.currentStreak += 1;
    } else if (streak.lastActiveDate) {
      streak.currentStreak = 1; // Gap — reset
    } else {
      streak.currentStreak = 1; // First ever
    }

    streak.lastActiveDate = today;
    streak.totalDays += 1;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    await AsyncStorage.setItem(KEYS.STREAK_DATA, JSON.stringify(streak));
    return streak;
  }

  // ============= GOAL TRACKING =============

  static async addGoal(content: string, source: TrackedGoal['source']): Promise<TrackedGoal> {
    const memory = await this.getLongTermMemory();
    const goals = memory.trackedGoals || [];
    const goal: TrackedGoal = {
      id: Date.now().toString(),
      content,
      source,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    goals.push(goal);
    await this.updateLongTermMemory({ trackedGoals: goals });
    return goal;
  }

  static async updateGoalStatus(goalId: string, status: TrackedGoal['status']): Promise<void> {
    const memory = await this.getLongTermMemory();
    const goals = memory.trackedGoals || [];
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.status = status;
      if (status === 'completed') goal.completedAt = new Date().toISOString();
      await this.updateLongTermMemory({ trackedGoals: goals });
    }
  }

  static async getActiveGoals(): Promise<TrackedGoal[]> {
    const memory = await this.getLongTermMemory();
    return (memory.trackedGoals || []).filter(g => g.status === 'active');
  }

  // ============= OFFLINE MESSAGE QUEUE =============

  static async addToQueue(msg: QueuedMessage): Promise<void> {
    const queue = await this.getMessageQueue();
    queue.push(msg);
    await AsyncStorage.setItem(KEYS.MESSAGE_QUEUE, JSON.stringify(queue));
  }

  static async getMessageQueue(): Promise<QueuedMessage[]> {
    const data = await AsyncStorage.getItem(KEYS.MESSAGE_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  static async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getMessageQueue();
    const filtered = queue.filter(m => m.id !== id);
    await AsyncStorage.setItem(KEYS.MESSAGE_QUEUE, JSON.stringify(filtered));
  }

  // ============= WEEKLY DIGEST =============

  static async saveWeeklyDigest(digest: WeeklyDigest): Promise<void> {
    const digests = await this.getDigests(12);
    digests.push(digest);
    if (digests.length > 12) digests.splice(0, digests.length - 12);
    await AsyncStorage.setItem(KEYS.WEEKLY_DIGESTS, JSON.stringify(digests));
  }

  static async getLatestDigest(): Promise<WeeklyDigest | null> {
    const digests = await this.getDigests(1);
    return digests.length > 0 ? digests[digests.length - 1] : null;
  }

  static async getDigests(count: number = 12): Promise<WeeklyDigest[]> {
    const data = await AsyncStorage.getItem(KEYS.WEEKLY_DIGESTS);
    const all: WeeklyDigest[] = data ? JSON.parse(data) : [];
    return all.slice(-count);
  }

  // ============= DAILY CHALLENGE =============

  static async getDailyChallenge(): Promise<DailyChallenge | null> {
    const data = await AsyncStorage.getItem(KEYS.DAILY_CHALLENGE);
    return data ? JSON.parse(data) : null;
  }

  static async saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
    await AsyncStorage.setItem(KEYS.DAILY_CHALLENGE, JSON.stringify(challenge));
  }

  static async completeDailyChallenge(): Promise<void> {
    const challenge = await this.getDailyChallenge();
    if (!challenge) return;
    challenge.status = 'completed';
    await AsyncStorage.setItem(KEYS.DAILY_CHALLENGE, JSON.stringify(challenge));
    await this.archiveChallenge(challenge);
  }

  static async skipDailyChallenge(): Promise<void> {
    const challenge = await this.getDailyChallenge();
    if (!challenge) return;
    challenge.status = 'skipped';
    await AsyncStorage.setItem(KEYS.DAILY_CHALLENGE, JSON.stringify(challenge));
    await this.archiveChallenge(challenge);
  }

  private static async archiveChallenge(challenge: DailyChallenge): Promise<void> {
    const data = await AsyncStorage.getItem(KEYS.CHALLENGE_HISTORY);
    const history: DailyChallenge[] = data ? JSON.parse(data) : [];
    history.push(challenge);
    if (history.length > 30) history.splice(0, history.length - 30);
    await AsyncStorage.setItem(KEYS.CHALLENGE_HISTORY, JSON.stringify(history));
  }

  static async getChallengeHistory(count: number = 30): Promise<DailyChallenge[]> {
    const data = await AsyncStorage.getItem(KEYS.CHALLENGE_HISTORY);
    const all: DailyChallenge[] = data ? JSON.parse(data) : [];
    return all.slice(-count);
  }

  // ============= NOTIFICATION SETTINGS =============

  static async getNotificationSettings(): Promise<{ enabled: boolean; hour: number; minute: number }> {
    const data = await AsyncStorage.getItem(KEYS.NOTIFICATION_SETTINGS);
    return data ? JSON.parse(data) : { enabled: false, hour: 9, minute: 0 };
  }

  static async saveNotificationSettings(settings: { enabled: boolean; hour: number; minute: number }): Promise<void> {
    await AsyncStorage.setItem(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  }

  // ============= SKIPPED QUESTIONS =============

  static async getSkippedQuestions(): Promise<string[]> {
    const data = await AsyncStorage.getItem(KEYS.SKIPPED_QUESTIONS);
    return data ? JSON.parse(data) : [];
  }

  static async addSkippedQuestion(id: string): Promise<void> {
    const skipped = await this.getSkippedQuestions();
    if (!skipped.includes(id)) {
      skipped.push(id);
      await AsyncStorage.setItem(KEYS.SKIPPED_QUESTIONS, JSON.stringify(skipped));
    }
  }

  static async removeSkippedQuestion(id: string): Promise<void> {
    const skipped = await this.getSkippedQuestions();
    const filtered = skipped.filter(q => q !== id);
    await AsyncStorage.setItem(KEYS.SKIPPED_QUESTIONS, JSON.stringify(filtered));
  }

  // ============= PAYMENT STATUS =============

  static async savePaymentStatus(status: { hasAccess: boolean; status: string; planType: string }): Promise<void> {
    await AsyncStorage.setItem(KEYS.PAYMENT_STATUS, JSON.stringify(status));
  }

  static async getPaymentStatus(): Promise<{ hasAccess: boolean; status: string; planType: string } | null> {
    const data = await AsyncStorage.getItem(KEYS.PAYMENT_STATUS);
    return data ? JSON.parse(data) : null;
  }

  static async hasPaymentAccess(): Promise<boolean> {
    const status = await this.getPaymentStatus();
    return status?.hasAccess === true;
  }

  static async clearPaymentStatus(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.PAYMENT_STATUS);
  }

  // ============= RESET & DEBUG =============

  static async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }

  static async hasCompletedOnboarding(): Promise<boolean> {
    const futureSelf = await this.getFutureSelf();
    return futureSelf !== null;
  }
}
