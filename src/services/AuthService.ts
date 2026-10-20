/**
 * AuthService - Handles authentication with the backend server
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FutureSelfModel } from '../types/FutureSelf';
import { StorageService } from './Storage';
import { Config } from '../config';

const API_URL = Config.API_URL;

const STORAGE_KEYS = {
  AUTH_TOKEN: '@future_you:auth_token',
  USER_DATA: '@future_you:user_data',
};

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
  hasProfile?: boolean;
  profile?: FutureSelfModel;
}

interface SyncResponse {
  user: User;
  profile: {
    futureSelfData: FutureSelfModel;
    longTermMemory?: any;
  } | null;
  reflections: any[];
}

export class AuthService {
  private static token: string | null = null;

  /**
   * Initialize auth service - load token from storage
   */
  static async initialize(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        this.token = token;
        // Verify token is still valid
        const isValid = await this.verifyToken();
        return isValid;
      }
      return false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated (also rehydrates in-memory token)
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      this.token = token;
    }
    return !!token;
  }

  /**
   * Get auth headers for API requests
   */
  static getAuthHeaders(): { Authorization: string } | {} {
    if (!this.token) return {};
    return { Authorization: `Bearer ${this.token}` };
  }

  /**
   * Sign up new user
   */
  static async signup(
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Save token and user data
      this.token = data.token;
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

      return data;
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  }

  /**
   * Login existing user
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token and user data
      this.token = data.token;
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

      // If user has a profile, sync it to local storage
      if (data.profile) {
        await StorageService.saveImmutableMemory(data.profile);
      }

      return data;
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Verify token is still valid (rehydrates in-memory token on success).
   * If server is unreachable, assumes token is valid to keep user signed in.
   */
  static async verifyToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        this.token = token;
        return true;
      }
      // Server explicitly rejected the token (401/403) — token is invalid
      return false;
    } catch {
      // Network error — server unreachable, keep user signed in with cached token
      this.token = token;
      return true;
    }
  }

  /**
   * Save profile to backend
   */
  static async saveProfile(futureSelfData: FutureSelfModel, longTermMemory?: any): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        console.log('No auth token, skipping backend profile save');
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ futureSelfData, longTermMemory }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to save profile to backend:', data.error);
      }
    } catch (error) {
      console.error('Error saving profile to backend:', error);
      // Don't throw - profile is saved locally anyway
    }
  }

  /**
   * Sync all data from backend
   */
  static async syncData(): Promise<SyncResponse | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return null;

      const response = await fetch(`${API_URL}/sync`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data: SyncResponse = await response.json();

      // Sync profile to local storage
      if (data.profile?.futureSelfData) {
        await StorageService.saveImmutableMemory(data.profile.futureSelfData);
        if (data.profile.longTermMemory) {
          await StorageService.updateLongTermMemory(data.profile.longTermMemory);
        }
      }

      // Sync reflections
      if (data.reflections?.length > 0) {
        for (const reflection of data.reflections) {
          await StorageService.saveReflection(reflection);
        }
      }

      return data;
    } catch (error) {
      console.error('Sync error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Create a Stripe Checkout Session for subscription
   */
  static async createCheckoutSession(): Promise<{ sessionId: string; url: string }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/payment/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
    return data;
  }

  /**
   * Get payment/subscription status from backend
   */
  static async getPaymentStatus(): Promise<{ hasAccess: boolean; status: string; planType: string }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/payment/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get payment status');
    return data;
  }

  /**
   * Validate a promo code
   */
  static async validatePromoCode(code: string): Promise<{ valid: boolean; message: string; hasAccess: boolean }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to validate promo code');
    return data;
  }

  /**
   * Store memory nuggets with vector embeddings on backend
   */
  static async extractMemories(nuggets: string[], sessionDate: string): Promise<{ stored: number }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return { stored: 0 };

    try {
      const response = await fetch(`${API_URL}/memory/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nuggets, sessionDate }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error storing memories:', error);
      return { stored: 0 };
    }
  }

  /**
   * Retrieve relevant memories via vector similarity search
   */
  static async retrieveMemories(query: string, limit?: number): Promise<string[]> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return [];

    try {
      const response = await fetch(`${API_URL}/memory/retrieve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, limit: limit || 8 }),
      });
      const data = await response.json();
      return data.memories || [];
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Get all stored memories grouped by date (for Memory screen)
   */
  static async getAllMemories(): Promise<{ days: { date: string; memories: { content: string; createdAt: string }[] }[]; totalMemories: number }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return { days: [], totalMemories: 0 };

    try {
      const response = await fetch(`${API_URL}/memory/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return { days: data.days || [], totalMemories: data.totalMemories || 0 };
    } catch (error) {
      console.error('Error fetching all memories:', error);
      return { days: [], totalMemories: 0 };
    }
  }

  /**
   * Send photo to server for AI aging via Replicate
   */
  static async agePhoto(photoBase64: string, currentAge: number, targetAge: number): Promise<string | null> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/ai/age-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: photoBase64, currentAge, targetAge }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.agedPhoto || null;
    } catch (error) {
      console.error('Error aging photo:', error);
      return null;
    }
  }

  /**
   * Get aged photo from server (for reloading on app restart)
   */
  static async getAgedPhoto(): Promise<{ agedPhoto: string | null; profilePhoto: string | null }> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return { agedPhoto: null, profilePhoto: null };

    try {
      const response = await fetch(`${API_URL}/ai/aged-photo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return { agedPhoto: null, profilePhoto: null };
      const data = await response.json();
      return { agedPhoto: data.agedPhoto || null, profilePhoto: data.profilePhoto || null };
    } catch (error) {
      return { agedPhoto: null, profilePhoto: null };
    }
  }

  /**
   * Save reflection to backend
   */
  static async saveReflection(reflectionData: any, sessionId?: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) return;

      await fetch(`${API_URL}/reflections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reflectionData, sessionId }),
      });
    } catch (error) {
      console.error('Error saving reflection to backend:', error);
    }
  }
}
