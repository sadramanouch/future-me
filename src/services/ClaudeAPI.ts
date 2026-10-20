/**
 * Claude API Integration
 * Proxies all AI calls through the backend server.
 * The API key never leaves the server — the client only sends prompts/messages.
 */

import { FutureSelfModel } from '../types/FutureSelf';
import { Message, ConversationSession, ReflectionSummary, WeeklyDigest } from '../types/Memory';
import { generateSystemPrompt, PromptContext } from '../core/SystemPrompt';
import { StorageService } from './Storage';
import { AuthService } from './AuthService';
import { Config } from '../config';

const API_URL = Config.API_URL;

/**
 * Make an authenticated request to a server AI proxy endpoint.
 */
async function aiRequest(endpoint: string, body: object): Promise<any> {
  // Ensure auth token is rehydrated before making AI calls
  if (!AuthService.getAuthHeaders().hasOwnProperty('Authorization')) {
    await AuthService.isAuthenticated();
  }

  const headers: any = {
    'Content-Type': 'application/json',
    ...AuthService.getAuthHeaders(),
  };

  const response = await fetch(`${API_URL}/ai/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Server error: ${response.status}`;

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export class ClaudeAPIService {

  /**
   * Send a message to Future Self and get a response
   */
  static async sendMessage(
    userMessage: string,
    futureSelf: FutureSelfModel,
    conversationHistory: Message[],
    promptContext?: PromptContext
  ): Promise<string> {
    const longTermMemory = await StorageService.getLongTermMemory();
    const recentReflections = await StorageService.getRecentReflections(2);
    const onboardingProfile = await StorageService.getOnboardingProfile();
    const activeGoals = await StorageService.getActiveGoals();
    const ctx: PromptContext = {
      ...promptContext,
      activeGoals: activeGoals.map(g => g.content),
    };
    const systemPrompt = generateSystemPrompt(futureSelf, longTermMemory, recentReflections, onboardingProfile, ctx);

    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    try {
      const data = await aiRequest('message', {
        systemPrompt,
        messages,
        model: Config.CLAUDE_MODEL,
        maxTokens: Config.CLAUDE_MAX_TOKENS,
      });

      return data.response || 'I apologize, but I could not generate a response.';
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw new Error(error.message || 'Failed to get response. Please try again.');
    }
  }

  /**
   * Generate the opening message from Future Self after onboarding completes.
   * Uses onboarding data to create a deeply personal first message.
   */
  static async generateOpeningMessage(
    futureSelf: FutureSelfModel,
    onboardingProfile: any
  ): Promise<string> {
    const cs = onboardingProfile?.currentState;
    const fd = onboardingProfile?.futureDesign;

    const prompt = `You are ${futureSelf.coreIdentity.name}, speaking as someone's future self from ${futureSelf.coreIdentity.yearsAhead} years ahead. This is your VERY FIRST message to your past self (age ${futureSelf.coreIdentity.currentAge}).

Use these details to make it deeply personal — reference SPECIFIC things only they would know:
${cs?.identity?.occupation ? `- They work as/focus on: ${cs.identity.occupation}` : ''}
${cs?.patterns?.lowestSelf ? `- Their lowest-self pattern: ${cs.patterns.lowestSelf}` : ''}
${cs?.beliefs?.limitingBeliefs ? `- A belief holding them back: ${cs.beliefs.limitingBeliefs}` : ''}
${fd?.vision?.northStar ? `- Their North Star goal: ${fd.vision.northStar}` : ''}
${cs?.identity?.lifeChapters ? `- Key life chapters: ${cs.identity.lifeChapters}` : ''}

Rules:
- 2 sentences maximum. One personal observation + one question. That's it.
- Speak as "I" (you are them, older). Use "we/our" to bridge the gap.
- Reference ONE specific detail from their data so they feel seen
- End with an open question that invites them to start talking
- Be direct, real, slightly vulnerable. Not motivational-speaker. Not generic.
- Never use emojis
- Never say "as your future self" — you ARE the future self`;

    try {
      const data = await aiRequest('opening-message', { prompt });
      return data.response || "I've been waiting for this. There's a lot I want to tell you. What's on your mind?";
    } catch (error) {
      console.error('Failed to generate opening message:', error);
      return "I've been waiting for this. There's a lot I want to tell you. What's on your mind?";
    }
  }

  /**
   * Generate a reflection summary after a conversation ends
   */
  static async generateReflection(
    session: ConversationSession,
    futureSelf: FutureSelfModel
  ): Promise<ReflectionSummary> {
    const conversationText = session.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const reflectionPrompt = `You are analyzing a conversation between a user and their Future Self.

The Future Self is: ${futureSelf.coreIdentity.name}, ${futureSelf.coreIdentity.yearsAhead} years in the future.

Core values: ${futureSelf.values.core.join(', ')}
Non-negotiables: ${futureSelf.values.nonNegotiables.join(', ')}

Here is the conversation:

${conversationText}

Generate a structured reflection summary in JSON format with these fields:

{
  "whatHappened": "Neutral 2-sentence summary of what was discussed",
  "keyInsights": ["insight 1", "insight 2", "..."],
  "misalignmentsDetected": ["behavior that contradicts future identity"],
  "recommendedActions": ["concrete next step 1", "concrete next step 2"],
  "progressIndicators": ["signs of growth or regression"],
  "conflictsWithIdentity": [
    {
      "behavior": "what the user is doing",
      "contradicts": "which value or principle",
      "severity": "low | medium | high"
    }
  ],
  "emotionalTone": "supportive | challenging | warning | celebratory"
}

Return ONLY the JSON, no other text.`;

    try {
      const data = await aiRequest('reflection', { prompt: reflectionPrompt });
      const reflectionData = JSON.parse(data.response);

      const reflection: ReflectionSummary = {
        id: Date.now().toString(),
        conversationId: session.id,
        createdAt: new Date().toISOString(),
        ...reflectionData,
      };

      return reflection;
    } catch (error) {
      console.error('Failed to generate reflection:', error);

      return {
        id: Date.now().toString(),
        conversationId: session.id,
        createdAt: new Date().toISOString(),
        whatHappened: 'A conversation took place.',
        keyInsights: [],
        misalignmentsDetected: [],
        recommendedActions: [],
        progressIndicators: [],
        conflictsWithIdentity: [],
        emotionalTone: 'supportive',
      };
    }
  }

  /**
   * Generate a weekly digest summarizing recent activity
   */
  static async generateWeeklyDigest(
    reflections: ReflectionSummary[],
    sessions: ConversationSession[],
    futureSelf: FutureSelfModel
  ): Promise<WeeklyDigest> {
    const reflectionSummaries = reflections.map(r =>
      `- ${r.whatHappened} (Insights: ${r.keyInsights.join('; ')})`
    ).join('\n');

    const prompt = `Summarize this person's week with their Future Self app. They are ${futureSelf.coreIdentity.name}, working toward: ${futureSelf.values.core.join(', ')}.

${reflections.length} reflections this week:
${reflectionSummaries || 'None'}

${sessions.length} conversations total.

Return JSON only:
{
  "summary": "2-3 sentence week summary",
  "conversationCount": ${sessions.length},
  "topPatterns": ["pattern1", "pattern2"],
  "progressMade": ["progress1"],
  "focusArea": "one thing to focus on next week"
}`;

    try {
      const data = await aiRequest('weekly-digest', { prompt });
      const parsed = JSON.parse(data.response || '{}');

      return {
        id: Date.now().toString(),
        weekOf: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        ...parsed,
      };
    } catch (error) {
      console.error('Failed to generate weekly digest:', error);
      return {
        id: Date.now().toString(),
        weekOf: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        summary: 'Unable to generate digest this week.',
        conversationCount: sessions.length,
        topPatterns: [],
        progressMade: [],
        focusArea: '',
      };
    }
  }

  /**
   * Generate a daily micro-challenge based on user's goals and patterns
   */
  static async generateDailyChallenge(
    futureSelf: FutureSelfModel,
    goals: string[],
    patterns: string[]
  ): Promise<string> {
    const prompt = `You are ${futureSelf.coreIdentity.name}'s future self. Create ONE specific micro-challenge for them today.

Their values: ${futureSelf.values.core.join(', ')}
Their active goals: ${goals.length > 0 ? goals.join('; ') : 'none set yet'}
Their recurring patterns: ${patterns.length > 0 ? patterns.join('; ') : 'none detected yet'}

Rules:
- ONE sentence only
- Make it specific and actionable (not vague like "be mindful")
- Something completable today
- Connected to their values or goals
- Examples: "Before lunch, write down 3 things you're avoiding right now." or "Call one person you've been meaning to reach out to."

Return ONLY the challenge text, nothing else.`;

    try {
      const data = await aiRequest('daily-challenge', { prompt });
      return data.response || 'Spend 5 minutes writing down what you want your tomorrow to look like.';
    } catch (error) {
      console.error('Failed to generate daily challenge:', error);
      return 'Spend 5 minutes writing down what you want your tomorrow to look like.';
    }
  }

  /**
   * Extract ultra-compact memory nuggets from a conversation session.
   * Each nugget is max 15 words — facts, decisions, emotions, or commitments only.
   */
  static async extractMemoryNuggets(
    session: ConversationSession
  ): Promise<string[]> {
    const conversationText = session.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `Extract 2-5 essential memory nuggets from this conversation.

Rules:
- Each nugget: 1 sentence, max 15 words
- Only facts, decisions, emotions, or commitments that matter for future conversations
- No filler, no context-setting, no generic observations
- Write as "User [verb]..." (e.g., "User decided to quit job by March", "User fears abandonment from father leaving")
- Skip pleasantries, greetings, meta-conversation
- If conversation was trivial, return fewer nuggets or empty array

Conversation:
${conversationText}

Return ONLY a JSON array of strings. No other text.`;

    try {
      const data = await aiRequest('memory-nuggets', { prompt });
      return Array.isArray(data.nuggets) ? data.nuggets : [];
    } catch (error) {
      console.error('Failed to extract memory nuggets:', error);
      return [];
    }
  }

  /**
   * Test server AI connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const data = await aiRequest('test', {});
      return data.connected === true;
    } catch {
      return false;
    }
  }
}
