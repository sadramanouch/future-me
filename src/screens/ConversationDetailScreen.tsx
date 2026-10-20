/**
 * ConversationDetailScreen - Read-only view of a past conversation
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
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/Storage';
import { ConversationSession, Message } from '../types/Memory';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ ConversationDetail: { sessionId: string } }, 'ConversationDetail'>;
};

export const ConversationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { sessionId } = route.params;
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const history = await StorageService.getSessionsHistory();
      const found = history.find(s => s.id === sessionId);
      setSession(found || null);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={isUser ? styles.messageRowUser : styles.messageRowAssistant}>
        <View style={[styles.timeRow, isUser ? styles.timeRowUser : styles.timeRowAssistant]}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.userBubble, alignSelf: 'flex-end', borderBottomRightRadius: 6 }
            : { backgroundColor: colors.assistantBubble, borderWidth: 1, borderColor: colors.assistantBubbleBorder, alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
        ]}>
          <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.textSecondary }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Conversation not found</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {formatDate(session.startedAt)}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={session.messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {session.wasReflectionGenerated && (
        <TouchableOpacity
          style={[styles.reflectionBanner, { backgroundColor: colors.bgSecondary, borderTopColor: colors.borderLight }]}
          onPress={() => navigation.navigate('Reflection', { reflectionId: session.id })}
        >
          <Text style={[styles.reflectionText, { color: colors.accentBlue }]}>
            View Reflection →
          </Text>
        </TouchableOpacity>
      )}
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
  headerTitle: { fontSize: 16, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },
  messageRowUser: { alignItems: 'flex-end', marginBottom: 8 },
  messageRowAssistant: { alignItems: 'flex-start', marginBottom: 8 },
  timeRow: { marginBottom: 4, paddingHorizontal: 4 },
  timeRowUser: { alignSelf: 'flex-end' },
  timeRowAssistant: { alignSelf: 'flex-start' },
  timeText: { fontSize: 11 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  emptyText: { fontSize: 16 },
  reflectionBanner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  reflectionText: { fontSize: 15, fontWeight: '600' },
});
