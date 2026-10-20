/**
 * ConversationHistoryScreen - Browse past conversations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/Storage';
import { ConversationSession } from '../types/Memory';

const MOOD_EMOJI: Record<string, string> = {
  energized: '⚡',
  calm: '😌',
  anxious: '😰',
  sad: '😢',
  frustrated: '😤',
  stressed: '😓',
  motivated: '🔥',
  reflective: '🪞',
};

type Props = { navigation: NativeStackNavigationProp<any> };

export const ConversationHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const history = await StorageService.getSessionsHistory();
      setSessions(history.reverse()); // newest first
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getDuration = (session: ConversationSession) => {
    if (!session.endedAt) return '';
    const ms = new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime();
    const mins = Math.round(ms / 60000);
    return mins < 1 ? '<1 min' : `${mins} min`;
  };

  const getPreview = (session: ConversationSession) => {
    const firstUser = session.messages.find(m => m.role === 'user');
    return firstUser?.content.substring(0, 80) || 'No messages';
  };

  const renderSession = ({ item }: { item: ConversationSession }) => (
    <TouchableOpacity
      style={[styles.sessionCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
      onPress={() => navigation.navigate('ConversationDetail', { sessionId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
          {formatDate(item.startedAt)}
        </Text>
        <View style={styles.sessionMeta}>
          {item.context.userMood && (
            <Text style={styles.moodEmoji}>{MOOD_EMOJI[item.context.userMood] || ''}</Text>
          )}
          {getDuration(item) ? (
            <Text style={[styles.sessionDuration, { color: colors.textMuted }]}>
              {getDuration(item)}
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.sessionPreview, { color: colors.textSecondary }]} numberOfLines={2}>
        {getPreview(item)}
      </Text>
      <Text style={[styles.sessionCount, { color: colors.textMuted }]}>
        {item.messages.length} messages
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conversations</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No past conversations yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: { fontSize: 13, fontWeight: '600' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodEmoji: { fontSize: 16 },
  sessionDuration: { fontSize: 12 },
  sessionPreview: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  sessionCount: { fontSize: 12 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
