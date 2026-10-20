/**
 * ProgressDashboardScreen - Growth metrics and accountability
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { StorageService } from '../services/Storage';
import { StreakData, TrackedGoal, DailyChallenge, WeeklyDigest } from '../types/Memory';
import { hapticLight, hapticSuccess } from '../utils/haptics';

type Props = { navigation: NativeStackNavigationProp<any> };

export const ProgressDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [goals, setGoals] = useState<TrackedGoal[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [streakData, longTerm, reflections, challengeHistory, latestDigest] = await Promise.all([
        StorageService.getStreakData(),
        StorageService.getLongTermMemory(),
        StorageService.getRecentReflections(10),
        StorageService.getChallengeHistory(30),
        StorageService.getLatestDigest(),
      ]);

      setStreak(streakData);
      setGoals(longTerm.trackedGoals || []);
      setPatterns(longTerm.recurringPatterns || []);
      setChallenges(challengeHistory);
      setDigest(latestDigest);

      // Calculate alignment: % of recent reflections with 0 misalignments
      if (reflections.length > 0) {
        const aligned = reflections.filter(r => r.misalignmentsDetected.length === 0).length;
        setAlignmentScore(Math.round((aligned / reflections.length) * 100));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoalStatus = async (goal: TrackedGoal) => {
    hapticLight();
    const newStatus = goal.status === 'active' ? 'completed' : 'active';
    await StorageService.updateGoalStatus(goal.id, newStatus);
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined } : g));
    if (newStatus === 'completed') hapticSuccess();
  };

  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textMuted }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MOMENTUM</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>🔥 {streak?.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Current</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{streak?.longestStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Best</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{streak?.totalDays || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Days</Text>
            </View>
          </View>
        </View>

        {/* Alignment Score */}
        <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VALUES ALIGNMENT</Text>
          <View style={styles.alignmentRow}>
            <View style={[styles.alignmentBarBg, { backgroundColor: colors.border }]}>
              <View style={[
                styles.alignmentBarFill,
                {
                  width: `${alignmentScore}%`,
                  backgroundColor: alignmentScore >= 70 ? colors.accent : alignmentScore >= 40 ? colors.accentBlue : colors.accentRed,
                },
              ]} />
            </View>
            <Text style={[styles.alignmentText, { color: colors.text }]}>{alignmentScore}%</Text>
          </View>
          <Text style={[styles.alignmentHint, { color: colors.textMuted }]}>
            Based on your recent reflections
          </Text>
        </View>

        {/* Active Goals */}
        <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ACTIVE GOALS ({activeGoals.length})
          </Text>
          {activeGoals.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Goals will appear here from your conversations
            </Text>
          ) : (
            activeGoals.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalRow, { borderBottomColor: colors.borderLight }]}
                onPress={() => toggleGoalStatus(goal)}
              >
                <View style={[styles.goalCheckbox, { borderColor: colors.border }]} />
                <Text style={[styles.goalText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {goal.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
          {completedGoals.length > 0 && (
            <Text style={[styles.completedCount, { color: colors.accent }]}>
              {completedGoals.length} completed
            </Text>
          )}
        </View>

        {/* Challenge Stats */}
        {challenges.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CHALLENGES</Text>
            <Text style={[styles.challengeStat, { color: colors.text }]}>
              {completedChallenges} / {challenges.length} completed
            </Text>
          </View>
        )}

        {/* Weekly Digest */}
        {digest && (
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WEEKLY DIGEST</Text>
            <Text style={[styles.digestSummary, { color: colors.textSecondary }]}>{digest.summary}</Text>
            {digest.focusArea && (
              <View style={[styles.focusBadge, { backgroundColor: colors.accentDim }]}>
                <Text style={[styles.focusText, { color: colors.accent }]}>
                  Focus: {digest.focusArea}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECURRING PATTERNS</Text>
            {patterns.map((pattern, i) => (
              <View key={i} style={[styles.patternRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.patternText, { color: colors.textSecondary }]}>{pattern}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40 },
  statNumber: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  alignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  alignmentBarBg: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  alignmentBarFill: { height: '100%', borderRadius: 5 },
  alignmentText: { fontSize: 20, fontWeight: '700', width: 50, textAlign: 'right' },
  alignmentHint: { fontSize: 12 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  goalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  goalText: { flex: 1, fontSize: 14, lineHeight: 20 },
  completedCount: { fontSize: 13, fontWeight: '600', marginTop: 12 },
  challengeStat: { fontSize: 22, fontWeight: '700' },
  digestSummary: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
  focusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  focusText: { fontSize: 13, fontWeight: '600' },
  patternRow: { paddingVertical: 10, borderBottomWidth: 1 },
  patternText: { fontSize: 14, lineHeight: 20 },
});
