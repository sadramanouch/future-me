/**
 * ChatScreen - Main conversation interface with Future Self
 * Features: Voice input, profile/settings drawer, typewriter text, polished UI,
 * streak badge, mood check-in, daily challenge, weekly digest, offline indicator,
 * skipped questions prompt, theme toggle, notifications, export, goal tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/Storage';
import { ClaudeAPIService } from '../services/ClaudeAPI';
import { AuthService } from '../services/AuthService';
import { Message, ConversationSession, StreakData, DailyChallenge, WeeklyDigest } from '../types/Memory';
import { FutureSelfModel } from '../types/FutureSelf';
import { GuardrailSystem } from '../core/Guardrails';
import { PromptContext } from '../core/SystemPrompt';
import { VoiceInputButton } from '../components/onboarding/VoiceInputButton';
import { generateConversationStarters } from '../utils/conversationStarters';
import { useTheme } from '../context/ThemeContext';
import { hapticMedium, hapticSuccess } from '../utils/haptics';
import { MoodSelector } from '../components/MoodSelector';
import { ChallengeCard } from '../components/ChallengeCard';
import { NotificationService } from '../services/NotificationService';

const PROFILE_IMAGE_KEY = '@future_you:profile_image';
const AGED_IMAGE_KEY = '@future_you:aged_image';
const GENERIC_STARTERS = ['I need a push', 'Challenge me', 'What should I do today?'];

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Cross-platform alert helper
type AlertButtonStyle = 'default' | 'cancel' | 'destructive';
type AlertButtonType = { text: string; onPress?: () => void; style?: AlertButtonStyle };

const showAlert = (title: string, message: string, buttons?: AlertButtonType[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmButton = buttons.find(b => b.style !== 'cancel' && b.text !== 'Cancel');
        confirmButton?.onPress?.();
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
        cancelButton?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// Format time for message headers
const formatTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Fun thinking phrases that cycle while AI is responding
const THINKING_PHRASES = [
  "Consulting the future...",
  "Time traveling...",
  "Reading the timeline...",
  "Your future self is thinking...",
  "Gathering wisdom from ahead...",
  "Peering into what's next...",
  "Connecting across time...",
  "Future self is composing thoughts...",
  "Wisdom loading...",
  "Channeling future energy...",
  "Aligning timelines...",
  "Your older self is reflecting...",
  "Downloading life experience...",
  "Thinking 5 years ahead...",
  "Future perspective incoming...",
];

// --- Typewriter Text Component ---
const TypewriterText: React.FC<{
  text: string;
  style?: any;
  onComplete?: () => void;
}> = ({ text, style, onComplete }) => {
  const [displayedWords, setDisplayedWords] = useState(0);
  const words = text.split(' ');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayedWords(0);
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= words.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayedWords(words.length);
        onComplete?.();
        return;
      }
      setDisplayedWords(current);
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return (
    <Text style={style}>
      {words.slice(0, displayedWords + 1).join(' ')}
    </Text>
  );
};

export const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();

  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [futureSelf, setFutureSelf] = useState<FutureSelfModel | null>(null);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingPhrase, setThinkingPhrase] = useState(THINKING_PHRASES[0]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [agedImage, setAgedImage] = useState<string | null>(null);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>(GENERIC_STARTERS);

  // New feature state
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [showDigest, setShowDigest] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [crossSessionMemories, setCrossSessionMemories] = useState<string[]>([]);
  const [memoryDepth, setMemoryDepth] = useState(0);

  // Refs and animations
  const flatListRef = useRef<FlatList>(null);
  const panelWidth = useRef(new Animated.Value(0)).current;
  const thinkingOpacity = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const SIDE_PANEL_WIDTH = Math.min(320, Dimensions.get('window').width * 0.75);

  useEffect(() => {
    initializeChat();
  }, []);

  // Reload profile + image when returning from EditProfile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const img = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      setProfileImage(img);
      const aged = await AsyncStorage.getItem(AGED_IMAGE_KEY);
      setAgedImage(aged);
      if (!isInitializing) {
        const fs = await StorageService.getFutureSelf();
        if (fs) {
          setFutureSelf(fs);
          const refreshedStarters = await generateConversationStarters(fs);
          setStarters(refreshedStarters);
        }
      }
    });
    return unsubscribe;
  }, [navigation, isInitializing]);

  // Cycle thinking phrases while loading
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(thinkingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(thinkingOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setThinkingPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);

    const interval = setInterval(() => {
      setThinkingPhrase(prev => {
        let next = prev;
        while (next === prev) {
          next = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Animate dots for thinking indicator
  useEffect(() => {
    if (!isLoading) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading]);

  // Animate side panel width (push layout)
  useEffect(() => {
    Animated.timing(panelWidth, {
      toValue: showSidePanel ? SIDE_PANEL_WIDTH : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [showSidePanel]);

  // Periodic offline check
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Use browser's native online/offline detection
      const updateStatus = () => setIsOffline(!navigator.onLine);
      updateStatus();
      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
      return () => {
        window.removeEventListener('online', updateStatus);
        window.removeEventListener('offline', updateStatus);
      };
    } else {
      // Native: lightweight connectivity probe
      const checkOnline = async () => {
        try {
          await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' });
          setIsOffline(false);
        } catch {
          setIsOffline(true);
        }
      };
      checkOnline();
      const interval = setInterval(checkOnline, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Process queued messages when coming back online
  useEffect(() => {
    if (!isOffline && futureSelf) {
      processOfflineQueue();
    }
  }, [isOffline, futureSelf]);

  const processOfflineQueue = async () => {
    if (!futureSelf) return;
    const queue = await StorageService.getMessageQueue();
    for (const item of queue) {
      try {
        const response = await ClaudeAPIService.sendMessage(item.userMessage, futureSelf, messages);
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        await StorageService.addMessageToSession('assistant', response);
        await StorageService.removeFromQueue(item.id);
      } catch {
        // Will retry next cycle
      }
    }
  };

  const initializeChat = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Load profile images (original + aged)
      const img = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      setProfileImage(img);
      const aged = await AsyncStorage.getItem(AGED_IMAGE_KEY);
      setAgedImage(aged);

      const fs = await StorageService.getFutureSelf();
      if (!fs) {
        setError('Profile not found. Please complete onboarding first.');
        setIsInitializing(false);
        return;
      }
      setFutureSelf(fs);

      // Update streak
      const streakData = await StorageService.updateStreak();
      setStreak(streakData);
      if ([7, 30, 100].includes(streakData.currentStreak)) {
        hapticSuccess();
      }

      // Generate personalized starters from user data
      const personalizedStarters = await generateConversationStarters(fs);
      setStarters(personalizedStarters);

      let currentSession = await StorageService.getCurrentSession();
      if (!currentSession) {
        currentSession = await StorageService.startNewSession();
      }
      setSession(currentSession);

      // Check skipped questions
      const skipped = await StorageService.getSkippedQuestions();
      setSkippedCount(skipped.length);

      // Load notification settings
      const notifSettings = await StorageService.getNotificationSettings();
      setNotificationsEnabled(notifSettings.enabled);

      // Calculate memory depth (local memories + reflections)
      const longTermMem = await StorageService.getLongTermMemory();
      const reflections = await StorageService.getReflections();
      const localDepth = longTermMem.entries.length + reflections.length + longTermMem.recurringPatterns.length;
      setMemoryDepth(localDepth);

      // Retrieve cross-session memories (non-blocking) and update depth
      const goals = await StorageService.getActiveGoals();
      const memoryQuery = goals.length > 0
        ? `Goals: ${goals.map(g => g.content).join('; ')}`
        : `${fs.coreIdentity.name} personal growth conversation`;
      AuthService.retrieveMemories(memoryQuery).then(memories => {
        if (memories.length > 0) {
          setCrossSessionMemories(memories);
          setMemoryDepth(prev => prev + memories.length);
        }
      }).catch(() => {});

      // Check for daily challenge
      const existingChallenge = await StorageService.getDailyChallenge();
      const today = new Date().toISOString().split('T')[0];
      if (!existingChallenge || existingChallenge.date !== today) {
        // Generate new challenge in background
        generateDailyChallenge(fs);
      } else if (existingChallenge.status === 'pending') {
        setDailyChallenge(existingChallenge);
        setShowChallenge(true);
      }

      // Check for weekly digest
      const latestDigest = await StorageService.getLatestDigest();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (!latestDigest || new Date(latestDigest.createdAt).getTime() < oneWeekAgo) {
        generateWeeklyDigest(fs);
      } else {
        setWeeklyDigest(latestDigest);
        setShowDigest(true);
      }

      // If first ever session with no messages, show mood selector and inject opening message
      if (currentSession.messages.length === 0) {
        setShowMoodSelector(true);

        const openingMessage = await StorageService.getOpeningMessage();
        if (openingMessage) {
          const openingMsg: Message = {
            id: 'opening-' + Date.now().toString(),
            role: 'assistant',
            content: openingMessage,
            timestamp: new Date().toISOString(),
          };
          setAnimatingMessageId(openingMsg.id);
          setMessages([openingMsg]);
          await StorageService.addMessageToSession('assistant', openingMessage);
          return;
        }
      }

      setMessages(currentSession.messages);
    } catch (err: any) {
      console.error('Chat initialization error:', err);
      setError(err.message || 'Failed to initialize chat');
    } finally {
      setIsInitializing(false);
    }
  };

  const generateDailyChallenge = async (fs: FutureSelfModel) => {
    try {
      const goals = await StorageService.getActiveGoals();
      const longTermMemory = await StorageService.getLongTermMemory();
      const challengeText = await ClaudeAPIService.generateDailyChallenge(
        fs,
        goals.map(g => g.content),
        longTermMemory.recurringPatterns
      );
      const today = new Date().toISOString().split('T')[0];
      const challenge: DailyChallenge = {
        id: Date.now().toString(),
        date: today,
        challenge: challengeText,
        status: 'pending',
      };
      await StorageService.saveDailyChallenge(challenge);
      setDailyChallenge(challenge);
      setShowChallenge(true);
    } catch (err) {
      console.error('Failed to generate daily challenge:', err);
    }
  };

  const generateWeeklyDigest = async (fs: FutureSelfModel) => {
    try {
      const reflections = await StorageService.getRecentReflections();
      const sessions = await StorageService.getSessionsHistory();
      if (reflections.length === 0) return;
      const digest = await ClaudeAPIService.generateWeeklyDigest(reflections, sessions, fs);
      await StorageService.saveWeeklyDigest(digest);
      setWeeklyDigest(digest);
      setShowDigest(true);
    } catch (err) {
      console.error('Failed to generate weekly digest:', err);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setCurrentMood(mood);
    setShowMoodSelector(false);
    if (session) {
      await StorageService.updateSessionMood(mood);
    }
  };

  const handleMoodSkip = () => {
    setShowMoodSelector(false);
  };

  const handleChallengeComplete = async () => {
    await StorageService.completeDailyChallenge();
    setShowChallenge(false);
    hapticSuccess();
  };

  const handleChallengeSkip = async () => {
    await StorageService.skipDailyChallenge();
    setShowChallenge(false);
  };

  const buildPromptContext = (): PromptContext => {
    const ctx: PromptContext = {};
    if (currentMood) ctx.mood = currentMood;
    if (streak && streak.currentStreak > 1) ctx.streak = streak.currentStreak;
    if (dailyChallenge && dailyChallenge.status === 'pending') ctx.dailyChallenge = dailyChallenge.challenge;
    if (weeklyDigest) ctx.weeklyFocus = weeklyDigest.focusArea;
    if (crossSessionMemories.length > 0) ctx.crossSessionMemories = crossSessionMemories;
    return ctx;
  };

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  // Auto-send a conversation starter on tap
  const handleStarterTap = useCallback(async (starter: string) => {
    if (!futureSelf || !session || isLoading) return;
    setInputText('');
    setIsLoading(true);
    setError(null);
    hapticMedium();

    try {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: starter,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);
      await StorageService.addMessageToSession('user', starter);

      const response = await ClaudeAPIService.sendMessage(
        starter,
        futureSelf,
        messages,
        buildPromptContext()
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setAnimatingMessageId(assistantMsg.id);
      setMessages(prev => [...prev, assistantMsg]);
      await StorageService.addMessageToSession('assistant', response);
      checkGuardrails();
    } catch (err: any) {
      if (isOffline) {
        await StorageService.addToQueue({
          id: Date.now().toString(),
          userMessage: starter,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
        const offlineMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm offline right now. I'll respond when you're back online.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, offlineMsg]);
      } else {
        setError(err.message || 'Failed to send message');
        showAlert('Error', err.message || 'Failed to get response. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [futureSelf, session, isLoading, messages, currentMood, streak, dailyChallenge, weeklyDigest, isOffline]);

  // Get the user's first name for display
  const getUserFirstName = () => {
    const name = futureSelf?.coreIdentity.name || 'You';
    return name.split(' ')[0];
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !futureSelf || !session) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setError(null);
    hapticMedium();

    try {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);
      await StorageService.addMessageToSession('user', userMessage);

      const response = await ClaudeAPIService.sendMessage(
        userMessage,
        futureSelf,
        messages,
        buildPromptContext()
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setAnimatingMessageId(assistantMsg.id);
      setMessages(prev => [...prev, assistantMsg]);
      await StorageService.addMessageToSession('assistant', response);

      checkGuardrails();
    } catch (err: any) {
      if (isOffline) {
        await StorageService.addToQueue({
          id: Date.now().toString(),
          userMessage,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
        const offlineMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm offline right now. I'll respond when you're back online.",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, offlineMsg]);
      } else {
        setError(err.message || 'Failed to send message');
        showAlert('Error', err.message || 'Failed to get response. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkGuardrails = async () => {
    try {
      const updatedSession = await StorageService.getCurrentSession();
      if (!updatedSession || !futureSelf) return;

      const history = await StorageService.getSessionsHistory();
      const longTermMemory = await StorageService.getLongTermMemory();
      const reflections = await StorageService.getRecentReflections();

      const violations = GuardrailSystem.checkAll(
        updatedSession,
        futureSelf,
        history.length,
        Date.now() - new Date(history[0]?.startedAt || Date.now()).getTime(),
        longTermMemory.recurringPatterns,
        reflections
      );

      const critical = violations.find(v => v.severity === 'critical');
      if (critical) {
        const intervention = GuardrailSystem.generateInterventionMessage(critical);
        const interventionMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: intervention,
          timestamp: new Date().toISOString(),
        };
        setAnimatingMessageId(interventionMsg.id);
        setMessages(prev => [...prev, interventionMsg]);
        await StorageService.addMessageToSession('assistant', intervention);
      }
    } catch (err) {
      console.error('Guardrail check error:', err);
    }
  };

  const endConversation = async () => {
    if (!session || !futureSelf) return;

    showAlert(
      'End Conversation',
      'This will generate a reflection summary. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End & Reflect',
          onPress: async () => {
            try {
              setIsLoading(true);

              const endedSession = await StorageService.endSession();

              const reflection = await ClaudeAPIService.generateReflection(
                endedSession,
                futureSelf
              );
              await StorageService.saveReflection(reflection);
              setMemoryDepth(prev => prev + 1 + (reflection.misalignmentsDetected?.length || 0));

              const longTermMemory = await StorageService.getLongTermMemory();

              reflection.misalignmentsDetected.forEach(misalignment => {
                const existing = longTermMemory.entries.find(
                  e => e.content === misalignment && e.type === 'struggle'
                );
                if (existing) {
                  existing.frequency += 1;
                  existing.lastMentioned = new Date().toISOString();
                  if (existing.frequency >= 3 && !longTermMemory.recurringPatterns.includes(misalignment)) {
                    longTermMemory.recurringPatterns.push(misalignment);
                  }
                } else {
                  longTermMemory.entries.push({
                    id: Date.now().toString(),
                    type: 'struggle',
                    content: misalignment,
                    firstMentioned: new Date().toISOString(),
                    lastMentioned: new Date().toISOString(),
                    frequency: 1,
                    resolved: false,
                    tags: [],
                  });
                }
              });

              await StorageService.updateLongTermMemory(longTermMemory);

              // Auto-extract goals from reflection
              if (reflection.recommendedActions?.length) {
                const existingGoals = await StorageService.getActiveGoals();
                for (const action of reflection.recommendedActions) {
                  const alreadyTracked = existingGoals.some(
                    g => g.content.toLowerCase() === action.toLowerCase()
                  );
                  if (!alreadyTracked) {
                    await StorageService.addGoal(action, 'reflection');
                  }
                }
              }

              // Extract and store memory nuggets (non-blocking), update memory depth
              ClaudeAPIService.extractMemoryNuggets(endedSession).then(async (nuggets) => {
                if (nuggets.length > 0) {
                  const sessionDate = new Date().toISOString().split('T')[0];
                  await AuthService.extractMemories(nuggets, sessionDate);
                  setMemoryDepth(prev => prev + nuggets.length);
                }
              }).catch(() => {});

              navigation.navigate('Reflection', { reflectionId: reflection.id });

              const newSession = await StorageService.startNewSession();
              setSession(newSession);
              setMessages([]);
              setCurrentMood(null);

              // Refresh starters with latest reflection data
              const refreshedStarters = await generateConversationStarters(futureSelf);
              setStarters(refreshedStarters);
            } catch (err: any) {
              showAlert('Error', 'Failed to generate reflection');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const signOut = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to complete onboarding again to use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await NotificationService.cancelAllReminders();
              await StorageService.clearAllData();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (err) {
              console.error('Sign out error:', err);
            }
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        showAlert('Permissions Required', 'Please enable notifications in your device settings.');
        return;
      }
      await NotificationService.scheduleDailyReminder(20, 0); // 8 PM default
    } else {
      await NotificationService.cancelAllReminders();
    }
    setNotificationsEnabled(enabled);
    await StorageService.saveNotificationSettings({ enabled, hour: 20, minute: 0 });
  };

  // Check if we should show a header for this message (different sender or >2 min gap)
  const shouldShowHeader = (item: Message, index: number) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    if (prev.role !== item.role) return true;
    const gap = new Date(item.timestamp).getTime() - new Date(prev.timestamp).getTime();
    return gap > 120000;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const showHeader = shouldShowHeader(item, index);
    const firstName = getUserFirstName();
    const isAnimating = item.id === animatingMessageId;

    return (
      <View style={isUser ? styles.messageRowUser : styles.messageRowAssistant}>
        {showHeader && (
          <View style={[styles.messageHeader, isUser ? styles.messageHeaderUser : styles.messageHeaderAssistant]}>
            {!isUser && (
              <View style={styles.msgHeaderAvatar}>
                {(agedImage || profileImage) ? (
                  <Image source={{ uri: agedImage || profileImage! }} style={styles.msgHeaderAvatarImage} />
                ) : (
                  <Text style={styles.msgHeaderAvatarText}>
                    {futureSelf?.coreIdentity.name?.charAt(0).toUpperCase() || 'F'}
                  </Text>
                )}
              </View>
            )}
            <Text style={styles.messageHeaderName}>
              {isUser ? firstName : `Future ${firstName}`}
            </Text>
            <Text style={styles.messageHeaderTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? [styles.userMessage, { backgroundColor: colors.userBubble }] : [styles.assistantMessage, { backgroundColor: colors.assistantBubble, borderColor: colors.border }],
            !showHeader && (isUser ? styles.messageBubbleContinuedUser : styles.messageBubbleContinuedAssistant),
          ]}
        >
          {!isUser && isAnimating ? (
            <TypewriterText
              text={item.content}
              style={[styles.messageText, { color: colors.text }]}
              onComplete={() => setAnimatingMessageId(null)}
            />
          ) : (
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : { color: colors.text },
              ]}
            >
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your future self...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !futureSelf) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorIcon, { color: colors.accentRed }]}>!</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.accent }]} onPress={initializeChat}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={signOut}>
            <Text style={[styles.resetButtonText, { color: colors.accentRed }]}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Mood Selector Modal */}
      <MoodSelector
        visible={showMoodSelector}
        onSelect={handleMoodSelect}
        onSkip={handleMoodSkip}
      />

      <View style={styles.rootRow}>
        {/* Main Chat Area */}
        <View style={styles.mainArea}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowSidePanel(!showSidePanel)}
            >
              {(agedImage || profileImage) ? (
                <Image source={{ uri: agedImage || profileImage! }} style={[styles.avatarImage, { borderColor: colors.accent }]} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                  <Text style={styles.avatarText}>
                    {futureSelf?.coreIdentity.name?.charAt(0).toUpperCase() || 'F'}
                  </Text>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Future {getUserFirstName()}
                </Text>
                <View style={styles.headerStatusRow}>
                  {isOffline ? (
                    <View style={[styles.onlineDot, { backgroundColor: colors.accentRed }]} />
                  ) : (
                    <View style={styles.onlineDot} />
                  )}
                  <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                    {isOffline ? 'Offline' : futureSelf ? `${futureSelf.coreIdentity.yearsAhead}y ahead` : 'Loading...'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Memory Depth Indicator */}
            <View style={[styles.memoryBadge, { backgroundColor: `rgba(88, 166, 255, ${memoryDepth === 0 ? 0.06 : Math.min(0.08 + memoryDepth * 0.01, 0.25)})` }]}>
              <View style={[styles.memoryRing, { borderColor: colors.accentBlue, opacity: memoryDepth === 0 ? 0.3 : Math.min(0.4 + memoryDepth * 0.03, 1) }]} />
              <Text style={[styles.memoryText, { color: memoryDepth === 0 ? colors.textMuted : colors.accentBlue }]}>
                {memoryDepth === 0 ? 'New' : `${memoryDepth} ${memoryDepth === 1 ? 'memory' : 'memories'}`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.menuButton, { backgroundColor: colors.bgTertiary }, showSidePanel && { backgroundColor: colors.border }]}
              onPress={() => setShowSidePanel(!showSidePanel)}
            >
              <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>{showSidePanel ? '✕' : '☰'}</Text>
            </TouchableOpacity>
          </View>

          {/* Skipped Questions Banner */}
          {skippedCount > 0 && messages.length === 0 && (
            <TouchableOpacity
              style={[styles.skippedBanner, { backgroundColor: colors.bgSecondary, borderColor: colors.accentBlue }]}
              onPress={() => {
                navigation.navigate('Onboarding');
              }}
            >
              <Text style={[styles.skippedText, { color: colors.accentBlue }]}>
                Your future self is missing context. Tap to complete {skippedCount} skipped question{skippedCount > 1 ? 's' : ''}.
              </Text>
            </TouchableOpacity>
          )}

          {/* Weekly Digest Card */}
          {showDigest && weeklyDigest && messages.length === 0 && (
            <View style={[styles.digestCard, { backgroundColor: colors.bgSecondary, borderColor: colors.accent }]}>
              <View style={styles.digestHeader}>
                <Text style={[styles.digestLabel, { color: colors.accent }]}>WEEKLY DIGEST</Text>
                <TouchableOpacity onPress={() => setShowDigest(false)}>
                  <Text style={[styles.digestDismiss, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.digestSummary, { color: colors.text }]} numberOfLines={3}>{weeklyDigest.summary}</Text>
              {weeklyDigest.focusArea ? (
                <Text style={[styles.digestFocus, { color: colors.textSecondary }]}>Focus: {weeklyDigest.focusArea}</Text>
              ) : null}
            </View>
          )}

          {/* Daily Challenge Card */}
          {showChallenge && dailyChallenge && messages.length <= 1 && (
            <ChallengeCard
              challenge={dailyChallenge}
              onComplete={handleChallengeComplete}
              onSkip={handleChallengeSkip}
            />
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyAvatarLarge, { backgroundColor: colors.accent }]}>
                  {(agedImage || profileImage) ? (
                    <Image source={{ uri: agedImage || profileImage! }} style={styles.emptyAvatarImage} />
                  ) : (
                    <Text style={styles.emptyAvatarText}>
                      {futureSelf?.coreIdentity.name?.charAt(0).toUpperCase() || 'F'}
                    </Text>
                  )}
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Hey, it's Future {getUserFirstName()}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  What's on your mind? Ask anything, share your struggles, or seek guidance.
                </Text>
              </View>
            }
            ListFooterComponent={
              isLoading ? (
                <Animated.View style={[styles.thinkingRow, { opacity: thinkingOpacity }]}>
                  <View style={[styles.thinkingAvatarSmall, { backgroundColor: colors.accent }]}>
                    {(agedImage || profileImage) ? (
                      <Image source={{ uri: agedImage || profileImage! }} style={styles.thinkingAvatarImage} />
                    ) : (
                      <Text style={styles.thinkingAvatarText}>
                        {futureSelf?.coreIdentity.name?.charAt(0).toUpperCase() || 'F'}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.thinkingBubble, { backgroundColor: colors.assistantBubble, borderColor: colors.border }]}>
                    <View style={styles.thinkingDots}>
                      <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.accentBlue, opacity: dotsAnim }]} />
                      <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.accentBlue, opacity: Animated.subtract(1.4, dotsAnim) }]} />
                      <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.accentBlue, opacity: dotsAnim }]} />
                    </View>
                    <Text style={[styles.thinkingText, { color: colors.textMuted }]}>{thinkingPhrase}</Text>
                  </View>
                </Animated.View>
              ) : null
            }
          />

          {/* Conversation Starters */}
          {messages.length <= 1 && !isLoading && (
            <View style={styles.startersContainer}>
              {starters.map((starter) => (
                <TouchableOpacity
                  key={starter}
                  style={[styles.starterChip, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                  onPress={() => handleStarterTap(starter)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.starterText, { color: colors.textSecondary }]}>{starter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[styles.inputContainer, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Message your future self..."
                  placeholderTextColor={colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  editable={!isLoading}
                />
                <View style={styles.inputActions}>
                  <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={isLoading} />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.accent }, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.sendIcon}>↑</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Side Panel */}
        <Animated.View style={[styles.sidePanel, { width: panelWidth, backgroundColor: colors.bgSecondary, borderLeftColor: colors.border }]}>
          <ScrollView style={styles.sidePanelScroll}>
            {/* Profile Section */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Your Future Self</Text>
              <View style={styles.profileCard}>
                {(agedImage || profileImage) ? (
                  <Image source={{ uri: agedImage || profileImage! }} style={[styles.profileAvatarImage, { borderColor: colors.accent }]} />
                ) : (
                  <View style={[styles.profileAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={styles.profileAvatarText}>
                      {futureSelf?.coreIdentity.name?.charAt(0).toUpperCase() || 'F'}
                    </Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                    {futureSelf?.coreIdentity.name || 'Unknown'}
                  </Text>
                  <Text style={[styles.profileDetail, { color: colors.textMuted }]} numberOfLines={1}>
                    Age {futureSelf?.coreIdentity.age || '?'} · {futureSelf?.coreIdentity.yearsAhead || '?'}y ahead
                  </Text>
                </View>
              </View>

              {futureSelf?.values.core && futureSelf.values.core.length > 0 && (
                <View style={styles.valuesContainer}>
                  <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Core Values</Text>
                  <View style={styles.chipContainer}>
                    {futureSelf.values.core.slice(0, 6).map((value, index) => (
                      <View key={index} style={[styles.chip, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {futureSelf?.coreIdentity.dominantTraits && futureSelf.coreIdentity.dominantTraits.length > 0 && (
                <View style={styles.valuesContainer}>
                  <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Traits</Text>
                  <View style={styles.chipContainer}>
                    {futureSelf.coreIdentity.dominantTraits.slice(0, 6).map((trait, index) => (
                      <View key={index} style={[styles.chip, styles.traitChip, { borderColor: colors.accentBlue }]}>
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{trait}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Insights Section */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Insights</Text>

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowSidePanel(false);
                  navigation.navigate('Memory');
                }}
              >
                <Text style={styles.settingsIcon}>🧠</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.settingsText, { color: colors.textSecondary }]}>Memory</Text>
                  {memoryDepth > 0 && (
                    <Text style={[styles.memoryCountHint, { color: colors.accentBlue }]}>{memoryDepth}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowSidePanel(false);
                  navigation.navigate('ProgressDashboard');
                }}
              >
                <Text style={styles.settingsIcon}>📊</Text>
                <Text style={[styles.settingsText, { color: colors.textSecondary }]}>Progress Dashboard</Text>
              </TouchableOpacity>
            </View>

            {/* Settings Section */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Settings</Text>

              <View style={[styles.settingsItem, { borderBottomColor: colors.border }]}>
                <Text style={styles.settingsIcon}>🎨</Text>
                <Text style={[styles.settingsText, { color: colors.textSecondary, flex: 1 }]}>
                  {isDark ? 'Dark' : 'Light'} Theme
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#767577', true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {Platform.OS !== 'web' && (
                <View style={[styles.settingsItem, { borderBottomColor: colors.border }]}>
                  <Text style={styles.settingsIcon}>🔔</Text>
                  <Text style={[styles.settingsText, { color: colors.textSecondary, flex: 1 }]}>Daily Reminder</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: '#767577', true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowSidePanel(false);
                  navigation.navigate('EditProfile');
                }}
              >
                <Text style={styles.settingsIcon}>✏️</Text>
                <Text style={[styles.settingsText, { color: colors.textSecondary }]}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowSidePanel(false);
                  signOut();
                }}
              >
                <Text style={styles.settingsIcon}>🚪</Text>
                <Text style={[styles.settingsText, { color: colors.textSecondary }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>About</Text>
              <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                Future You v1.0.0{'\n'}
                Your personal AI-powered future self coach.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rootRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 14,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    borderWidth: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3FB950',
    marginRight: 5,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  memoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
    gap: 6,
  },
  memoryRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  memoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 16,
  },

  // --- Skipped Questions Banner ---
  skippedBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  skippedText: {
    fontSize: 13,
    textAlign: 'center',
  },

  // --- Weekly Digest Card ---
  digestCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  digestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  digestLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  digestDismiss: {
    fontSize: 16,
    padding: 4,
  },
  digestSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  digestFocus: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // --- Messages ---
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRowUser: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  messageRowAssistant: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  messageHeaderUser: {
    justifyContent: 'flex-end',
  },
  messageHeaderAssistant: {
    justifyContent: 'flex-start',
  },
  msgHeaderAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#238636',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  msgHeaderAvatarImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  msgHeaderAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  messageHeaderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B949E',
    marginRight: 6,
  },
  messageHeaderTime: {
    fontSize: 11,
    color: '#484F58',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 2,
  },
  messageBubbleContinuedUser: {
    borderTopRightRadius: 6,
  },
  messageBubbleContinuedAssistant: {
    borderTopLeftRadius: 6,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },

  // --- Empty State ---
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  emptyAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  emptyAvatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  // --- Conversation Starters ---
  startersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  starterChip: {
    borderWidth: 1,
    borderLeftWidth: 2,
    borderLeftColor: '#58A6FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  starterText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // --- Input ---
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'web' ? 16 : 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 22,
    marginRight: 8,
    paddingLeft: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  inputActions: {
    padding: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // --- Thinking Indicator ---
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  thinkingAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  thinkingAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  thinkingAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  thinkingBubble: {
    borderWidth: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '70%',
  },
  thinkingDots: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  thinkingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  thinkingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // --- Side Panel ---
  sidePanel: {
    borderLeftWidth: 1,
    overflow: 'hidden',
  },
  sidePanelScroll: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
  },
  profileDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  valuesContainer: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  traitChip: {
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
  },
  chipText: {
    fontSize: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingsIcon: {
    fontSize: 14,
    marginRight: 12,
    width: 28,
  },
  settingsText: {
    fontSize: 15,
  },
  memoryCountHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
