import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StorageService } from '../services/Storage';
import { ReflectionSummary } from '../types/Memory';
import { useTheme } from '../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const ReflectionsListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [reflections, setReflections] = useState<ReflectionSummary[]>([]);

  useEffect(() => {
    loadReflections();
  }, []);

  const loadReflections = async () => {
    const all = await StorageService.getReflections();
    setReflections(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  const getAlignmentScore = (reflection: ReflectionSummary): number => {
    const conflicts = reflection.conflictsWithIdentity?.length || 0;
    const highSeverity = reflection.conflictsWithIdentity?.filter(c => c.severity === 'high').length || 0;
    const medSeverity = reflection.conflictsWithIdentity?.filter(c => c.severity === 'medium').length || 0;
    const progress = reflection.progressIndicators?.length || 0;
    const penalty = (highSeverity * 20) + (medSeverity * 10) + (conflicts * 5);
    const bonus = progress * 10;
    return Math.max(0, Math.min(100, 80 + bonus - penalty));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#238636';
    if (score >= 60) return '#d29922';
    return '#f85149';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Past Reflections</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {reflections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No reflections yet. Complete a conversation to see your growth journey here.
            </Text>
          </View>
        ) : (
          reflections.map((r) => {
            const score = getAlignmentScore(r);
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Reflection', { reflectionId: r.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {formatDate(r.createdAt)}
                  </Text>
                  <View style={styles.scoreRow}>
                    <View style={[styles.toneBadge, { backgroundColor: getToneColor(r.emotionalTone) + '20', borderColor: getToneColor(r.emotionalTone) }]}>
                      <Text style={[styles.toneText, { color: getToneColor(r.emotionalTone) }]}>
                        {r.emotionalTone}
                      </Text>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) + '20' }]}>
                      <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
                        {score}%
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={3}>
                  {r.whatHappened}
                </Text>

                {r.keyInsights?.length > 0 && (
                  <View style={styles.insightsRow}>
                    {r.keyInsights.slice(0, 2).map((insight, i) => (
                      <Text key={i} style={[styles.insightChip, { color: colors.accent, borderColor: colors.accent + '40' }]} numberOfLines={1}>
                        {insight}
                      </Text>
                    ))}
                  </View>
                )}

                {(r.conflictsWithIdentity?.length > 0 || r.progressIndicators?.length > 0) && (
                  <View style={styles.statsRow}>
                    {r.progressIndicators?.length > 0 && (
                      <Text style={[styles.statText, { color: '#238636' }]}>
                        +{r.progressIndicators.length} growth
                      </Text>
                    )}
                    {r.conflictsWithIdentity?.length > 0 && (
                      <Text style={[styles.statText, { color: '#f85149' }]}>
                        {r.conflictsWithIdentity.length} conflict{r.conflictsWithIdentity.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700' },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: { fontSize: 13, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', gap: 8 },
  toneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  toneText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreText: { fontSize: 12, fontWeight: '700' },
  summary: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  insightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  insightChip: {
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '90%',
  },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
});
