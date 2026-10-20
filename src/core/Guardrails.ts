/**
 * PROMPT 5 Implementation: Guardrails Against Fantasy & Delusion
 *
 * Ethical and psychological safeguards for the Future You AI
 */

import { FutureSelfModel } from '../types/FutureSelf';
import { Message, ConversationSession } from '../types/Memory';

export interface GuardrailViolation {
  type: 'fantasy' | 'dependency' | 'abdication' | 'impossible-trajectory';
  severity: 'warning' | 'critical';
  description: string;
  suggestedCorrection: string;
}

/**
 * Analyzes user messages for signs of unhealthy patterns
 */
export class GuardrailSystem {
  /**
   * Detects fantasy reinforcement
   * Warning signs:
   * - User repeatedly talks about grand outcomes without discussing actions
   * - Future self is being used to validate fantasy, not examine reality
   * - Lack of acknowledgment of trade-offs or difficulty
   */
  static detectFantasyReinforcement(messages: Message[]): GuardrailViolation | null {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());

    const fantasyIndicators = [
      'i will be',
      'i am going to',
      'when i become',
      'after i achieve',
      'once i have',
    ];

    const actionIndicators = [
      'i did',
      'today i',
      'i practiced',
      'i chose',
      'i said no to',
    ];

    const fantasyCount = userMessages.filter(msg =>
      fantasyIndicators.some(indicator => msg.includes(indicator))
    ).length;

    const actionCount = userMessages.filter(msg =>
      actionIndicators.some(indicator => msg.includes(indicator))
    ).length;

    // More than 3 fantasy statements with no action statements
    if (fantasyCount > 3 && actionCount === 0) {
      return {
        type: 'fantasy',
        severity: 'warning',
        description: 'User is focused on outcomes without discussing concrete actions',
        suggestedCorrection: 'Future Self should redirect to present-moment choices and trade-offs',
      };
    }

    return null;
  }

  /**
   * Detects emotional dependency
   * Warning signs:
   * - User treats Future Self as primary emotional support
   * - Excessive conversation frequency (multiple times per day)
   * - User avoids making decisions without consulting Future Self
   */
  static detectEmotionalDependency(session: ConversationSession, totalSessions: number, timeSpan: number): GuardrailViolation | null {
    const messagesInSession = session.messages.length;
    const avgSessionsPerDay = totalSessions / (timeSpan / (1000 * 60 * 60 * 24));

    // More than 5 sessions per day is a red flag
    if (avgSessionsPerDay > 5) {
      return {
        type: 'dependency',
        severity: 'warning',
        description: 'High conversation frequency may indicate emotional dependency',
        suggestedCorrection: 'Future Self should encourage user autonomy and reflection time between sessions',
      };
    }

    // Conversations longer than 30 messages suggest over-reliance
    if (messagesInSession > 30) {
      return {
        type: 'dependency',
        severity: 'warning',
        description: 'Extended conversation may indicate avoidance of action',
        suggestedCorrection: 'Future Self should close the conversation and direct toward action',
      };
    }

    return null;
  }

  /**
   * Detects responsibility abdication
   * Warning signs:
   * - User asks "what should I do?" repeatedly
   * - User treats Future Self as decision-maker rather than perspective-giver
   * - Lack of self-agency in language
   */
  static detectResponsibilityAbdication(messages: Message[]): GuardrailViolation | null {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());

    const abdicationPhrases = [
      'what should i do',
      'tell me what to',
      'what would you do',
      'make this decision for me',
      'i need you to',
    ];

    const abdicationCount = userMessages.filter(msg =>
      abdicationPhrases.some(phrase => msg.includes(phrase))
    ).length;

    if (abdicationCount > 2) {
      return {
        type: 'abdication',
        severity: 'critical',
        description: 'User is asking Future Self to make decisions rather than offering perspective',
        suggestedCorrection: 'Future Self must refuse to decide and return agency: "I cannot choose for you. What do YOU believe is aligned with who you want to become?"',
      };
    }

    return null;
  }

  /**
   * Detects impossible trajectory
   * Warning signs:
   * - User's current patterns are fundamentally misaligned with stated future
   * - Multiple reflections show regression, not progress
   * - User refuses to acknowledge contradictions
   */
  static detectImpossibleTrajectory(
    futureSelf: FutureSelfModel,
    recurringPatterns: string[],
    recentReflections: { misalignmentsDetected: string[] }[]
  ): GuardrailViolation | null {
    const totalMisalignments = recentReflections.reduce(
      (sum, r) => sum + r.misalignmentsDetected.length,
      0
    );

    // If there are 5+ misalignments in recent reflections, trajectory is off
    if (totalMisalignments >= 5) {
      return {
        type: 'impossible-trajectory',
        severity: 'critical',
        description: 'Current behavior is consistently misaligned with stated future identity',
        suggestedCorrection: 'Future Self must directly confront the contradiction: "The person you say you want to become would not do what you are doing. Either your vision is wrong, or your actions are. Which is it?"',
      };
    }

    // Check if user has same recurring struggles for extended time (indicates stuck pattern)
    const stuckPatterns = recurringPatterns.filter(pattern =>
      pattern.includes('procrastination') ||
      pattern.includes('avoidance') ||
      pattern.includes('excuse')
    );

    if (stuckPatterns.length > 0) {
      return {
        type: 'impossible-trajectory',
        severity: 'warning',
        description: 'User has recurring patterns that block progress toward future identity',
        suggestedCorrection: 'Future Self should name the pattern explicitly and ask if user is truly committed to change',
      };
    }

    return null;
  }

  /**
   * Run all guardrails and return violations
   */
  static checkAll(
    session: ConversationSession,
    futureSelf: FutureSelfModel,
    totalSessions: number,
    timeSpan: number,
    recurringPatterns: string[],
    recentReflections: { misalignmentsDetected: string[] }[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = [];

    const fantasy = this.detectFantasyReinforcement(session.messages);
    if (fantasy) violations.push(fantasy);

    const dependency = this.detectEmotionalDependency(session, totalSessions, timeSpan);
    if (dependency) violations.push(dependency);

    const abdication = this.detectResponsibilityAbdication(session.messages);
    if (abdication) violations.push(abdication);

    const trajectory = this.detectImpossibleTrajectory(futureSelf, recurringPatterns, recentReflections);
    if (trajectory) violations.push(trajectory);

    return violations;
  }

  /**
   * Generate intervention message for Future Self to include
   */
  static generateInterventionMessage(violation: GuardrailViolation): string {
    switch (violation.type) {
      case 'fantasy':
        return "I notice we're talking a lot about where you want to be, but not what you're doing today. The future isn't built by talking about it. What action are you avoiding right now?";

      case 'dependency':
        return "You keep coming back to me for answers. But I can't live your life for you. What decision are you afraid to make on your own?";

      case 'abdication':
        return "I can't decide for you. I can only tell you what I know from having lived it. The choice is yours, and it always was. What do YOU believe is right?";

      case 'impossible-trajectory':
        return "I need to be direct: the person you say you want to become would not do what you are doing. Either your vision of me is wrong, or your actions are. Which is it?";

      default:
        return "Something is misaligned here. Let's stop and examine what's really happening.";
    }
  }
}

/**
 * Ethical Guidelines Summary
 *
 * 1. PREVENT FANTASY: Future Self must challenge unrealistic narratives
 * 2. PREVENT DEPENDENCY: Limit conversation frequency, force user autonomy
 * 3. ENCOURAGE AGENCY: Never make decisions for the user
 * 4. CONFRONT IMPOSSIBLE TRAJECTORIES: If current actions contradict stated future, name it directly
 * 5. NO HARM: If user shows signs of crisis, direct them to real help (not the app)
 */
