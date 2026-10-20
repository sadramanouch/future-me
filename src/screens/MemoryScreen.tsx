/**
 * MemoryScreen - Unified timeline of what the AI remembers about you.
 * Combines server-side memory nuggets, local reflections, and conversation metadata
 * into a single daily view.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/Storage';
import { AuthService } from '../services/AuthService';
import { ReflectionSummary, ConversationSession } from '../types/Memory';

type Props = { navigation: NativeStackNavigationProp<any> };

interface DayEntry {
  date: string;
  memories: string[];
  reflection: ReflectionSummary | null;
  conversationCount: number;
  sessionIds: string[];
  mood: string | null;
}

export const MemoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMemories, setTotalMemories] = useState(0);

  useEffect(() => {
    loadMemoryTimeline();
  }, []);

  const loadMemoryTimeline = async () => {
    try {
      // Load all data sources in parallel
      const [serverMemories, reflections, sessions] = await Promise.all([
        AuthService.getAllMemories(),
        StorageService.getReflections(),
        StorageService.getSessionsHistory(),
      ]);

      setTotalMemories(serverMemories.totalMemories);

      // Build a map of date → DayEntry
      const dayMap = new Map<string, DayEntry>();

      const getOrCreate = (date: string): DayEntry => {
        if (!dayMap.has(date)) {
          dayMap.set(date, {
            date,
            memories: [],
            reflection: null,
            conversationCount: 0,
            sessionIds: [],
            mood: null,
          });
        }
        return dayMap.get(date)!;
      };

      // Add server memories
      for (const day of serverMemories.days) {
        const entry = getOrCreate(day.date);
        entry.memories.push(...day.memories.map(m => m.content));
      }

      // Add reflections
      for (const r of reflections) {
        const date = r.createdAt.split('T')[0];
        const entry = getOrCreate(date);
        // Keep the most recent reflection per day
        if (!entry.reflection || r.createdAt > entry.reflection.createdAt) {
          entry.reflection = r;
        }
      }

      // Add conversation metadata
      for (const s of sessions) {
        const date = s.startedAt.split('T')[0];
        const entry = getOrCreate(date);
        entry.conversationCount += 1;
        entry.sessionIds.push(s.id);
        if (s.context.userMood && !entry.mood) {
          entry.mood = s.context.userMood as string;
        }
      }

      // Sort by date descending
      const sorted = Array.from(dayMap.values())
        .sort((a, b) => b.date.localeCompare(a.date));

      setDays(sorted);
    } catch (err) {
      console.error('Failed to load memory timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'celebratory': return '#238636';
      case 'warning': return '#d29922';
      case 'challenging': return '#f85149';
      case 'supportive': return '#58A6FF';
      default: return '#8b949e';
    }
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    const map: Record<string, string> = {
      energized: '⚡', calm: '😌', anxious: '😰', sad: '😢',
      frustrated: '😤', stressed: '😓', motivated: '🔥', reflective: '🪞',
    };
    return map[mood] || null;
  };

  const sections = days.map(day => ({
    title: day.date,
    data: [day],
  }));

  const renderDayCard = ({ item }: { item: DayEntry }) => {
    const hasContent = item.memories.length > 0 || item.reflection || item.conversationCount > 0;
    if (!hasContent) return null;

    const moodEmoji = getMoodEmoji(item.mood);

    return (
      <View style={[styles.dayCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
        {/* Meta row */}
        <View style={styles.metaRow}>
          {item.conversationCount > 0 && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.conversationCount} conversation{item.conversationCount > 1 ? 's' : ''}
            </Text>
          )}
          {moodEmoji && (
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          )}
          {item.reflection && (
            <View style={[styles.tonePill, { backgroundColor: getToneColor(item.reflection.emotionalTone) + '20' }]}>
              <Text style={[styles.toneText, { color: getToneColor(item.reflection.emotionalTone) }]}>
                {item.reflection.emotionalTone}
              </Text>
            </View>
          )}
        </View>

        {/* Memory nuggets */}
        {item.memories.length > 0 && (
          <View style={styles.memoriesSection}>
            {item.memories.map((memory, i) => (
              <View key={i} style={styles.memoryRow}>
                <View style={[styles.memoryDot, { backgroundColor: colors.accentBlue }]} />
                <Text style={[styles.memoryText, { color: colors.text }]}>{memory}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reflection summary */}
        {item.reflection && (
          <TouchableOpacity
            style={[styles.reflectionBox, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Reflection', { reflectionId: item.reflection!.id })}
          >
            <Text style={[styles.reflectionLabel, { color: colors.textMuted }]}>REFLECTION</Text>
            <Text style={[styles.reflectionText, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.reflection.whatHappened}
            </Text>
            {item.reflection.keyInsights?.length > 0 && (
              <View style={styles.insightsRow}>
                {item.reflection.keyInsights.slice(0, 2).map((insight, i) => (
                  <Text key={i} style={[styles.insightChip, { color: colors.accent, borderColor: colors.accent + '40' }]} numberOfLines={1}>
                    {insight}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* View conversation link */}
        {item.sessionIds.length > 0 && (
          <TouchableOpacity
            style={styles.viewConvoLink}
            onPress={() => navigation.navigate('ConversationDetail', { sessionId: item.sessionIds[0] })}
          >
            <Text style={[styles.viewConvoText, { color: colors.accentBlue }]}>
              View full conversation →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.timelineDot, { backgroundColor: colors.accentBlue }]} />
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {formatDate(section.title)}
      </Text>
      <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Memory</Text>
        <Text style={[styles.headerCount, { color: colors.accentBlue }]}>
          {totalMemories > 0 ? `${totalMemories}` : ''}
        </Text>
      </View>

      <SectionList
        sections={sections}
        renderItem={renderDayCard}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgSecondary }]}>
              <Text style={styles.emptyIconText}>○</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No memories yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              As you have conversations, your future self will remember the important things — decisions, emotions, commitments, and patterns.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backText: { fontSize: 16, width: 50 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerCount: { fontSize: 14, fontWeight: '600', width: 50, textAlign: 'right' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Section headers (timeline)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timelineLine: {
    flex: 1,
    height: 1,
  },

  // Day card
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaText: { fontSize: 12 },
  moodEmoji: { fontSize: 14 },
  tonePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toneText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // Memory nuggets
  memoriesSection: { gap: 6, marginBottom: 10 },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  memoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  memoryText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  // Reflection box
  reflectionBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  reflectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  reflectionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  insightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  insightChip: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: '90%',
  },

  // View conversation link
  viewConvoLink: { paddingTop: 4 },
  viewConvoText: { fontSize: 13, fontWeight: '500' },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 28, color: '#58A6FF' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
