/**
 * App Configuration
 *
 * App configuration for the Future You app.
 * Sensitive keys (Claude API, Stripe secret) are server-side only.
 */

export const Config = {
  // Claude API Configuration (key is server-side only, in server/.env)
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
  CLAUDE_MAX_TOKENS: 300,

  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

  // Backend API URL
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3005/api',

  // App Settings
  YEARS_AHEAD_DEFAULT: 5,
  MAX_SESSION_MESSAGES: 50,
  REFLECTION_INTERVAL_MESSAGES: 10,
};
