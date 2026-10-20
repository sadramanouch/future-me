/**
 * Personalized Conversation Starters
 * Generates dynamic starters from user data, prioritizing diversity across categories.
 */

import { FutureSelfModel } from '../types/FutureSelf';
import { StorageService } from '../services/Storage';

interface StarterCandidate {
  text: string;
  priority: number;
  category: 'values' | 'goals' | 'patterns' | 'recent' | 'generic';
}

const GENERIC_STARTERS = [
  'I need a push',
  'Challenge me',
  'What should I do today?',
];

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1).trimEnd() + '\u2026';
}

/**
 * Select up to `count` starters, preferring one from each category before doubling up.
 */
function selectDiverseStarters(candidates: StarterCandidate[], count: number): string[] {
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority);
  const selected: StarterCandidate[] = [];
  const usedCategories = new Set<string>();

  // First pass: one per category
  for (const candidate of sorted) {
    if (selected.length >= count) break;
    if (!usedCategories.has(candidate.category)) {
      selected.push(candidate);
      usedCategories.add(candidate.category);
    }
  }

  // Second pass: fill remaining slots
  for (const candidate of sorted) {
    if (selected.length >= count) break;
    if (!selected.includes(candidate)) {
      selected.push(candidate);
    }
  }

  return selected.map(s => s.text);
}

export async function generateConversationStarters(
  futureSelf: FutureSelfModel | null,
): Promise<string[]> {
  if (!futureSelf) return GENERIC_STARTERS;

  const candidates: StarterCandidate[] = [];

  try {
    const onboardingProfile = await StorageService.getOnboardingProfile();
    const longTermMemory = await StorageService.getLongTermMemory();
    const recentReflections = await StorageService.getRecentReflections(3);

    // Tier 1: Values-based
    const coreValues = futureSelf.values.core;
    if (coreValues.length > 0) {
      const value = coreValues[Math.floor(Math.random() * coreValues.length)];
      candidates.push({
        text: `Am I living by ${value}?`,
        priority: 1,
        category: 'values',
      });
    }

    const traits = futureSelf.coreIdentity.dominantTraits;
    if (traits.length > 0) {
      const trait = traits[Math.floor(Math.random() * traits.length)];
      candidates.push({
        text: `What would the ${trait} version of me do?`,
        priority: 1,
        category: 'values',
      });
    }

    // Tier 2: Goal-based
    const northStar = onboardingProfile?.futureDesign?.vision?.northStar;
    if (northStar) {
      candidates.push({
        text: `Am I closer to "${truncate(northStar, 40)}"?`,
        priority: 2,
        category: 'goals',
      });
    }

    const goalsInProgress = longTermMemory.goalsInProgress;
    if (goalsInProgress && goalsInProgress.length > 0) {
      const goal = goalsInProgress[Math.floor(Math.random() * goalsInProgress.length)];
      candidates.push({
        text: `How am I doing on: ${truncate(goal, 35)}`,
        priority: 2,
        category: 'goals',
      });
    }

    // Tier 3: Pattern-based
    if (onboardingProfile?.currentState?.patterns?.lowestSelf) {
      candidates.push({
        text: 'I feel my worst patterns creeping in',
        priority: 3,
        category: 'patterns',
      });
    }

    if (onboardingProfile?.currentState?.beliefs?.limitingBeliefs) {
      candidates.push({
        text: "I'm stuck in an old story again",
        priority: 3,
        category: 'patterns',
      });
    }

    if (longTermMemory.recurringPatterns && longTermMemory.recurringPatterns.length > 0) {
      candidates.push({
        text: 'I keep falling back into the same cycle',
        priority: 3,
        category: 'patterns',
      });
    }

    // Tier 4: Recent conversation-based
    if (recentReflections && recentReflections.length > 0) {
      const latest = recentReflections[recentReflections.length - 1];

      if (latest.recommendedActions && latest.recommendedActions.length > 0) {
        candidates.push({
          text: `Did I follow through on "${truncate(latest.recommendedActions[0], 35)}"?`,
          priority: 4,
          category: 'recent',
        });
      }

      if (latest.misalignmentsDetected && latest.misalignmentsDetected.length > 0) {
        candidates.push({
          text: 'I want to revisit what came up last time',
          priority: 4,
          category: 'recent',
        });
      }
    }
  } catch (error) {
    console.error('Error generating personalized starters:', error);
  }

  if (candidates.length === 0) {
    return GENERIC_STARTERS;
  }

  return selectDiverseStarters(candidates, 3);
}
