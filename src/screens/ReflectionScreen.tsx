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
import { RouteProp } from '@react-navigation/native';
import { StorageService } from '../services/Storage';
import { ReflectionSummary } from '../types/Memory';

type RootStackParamList = {
  Reflection: { reflectionId: string };
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<RootStackParamList, 'Reflection'>;
};

export const ReflectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [reflection, setReflection] = useState<ReflectionSummary | null>(null);

  useEffect(() => {
    loadReflection();
  }, []);

  const loadReflection = async () => {
    const reflections = await StorageService.getReflections();
    const found = reflections.find(r => r.id === route.params.reflectionId);
    if (found) {
      setReflection(found);
    }
  };

  if (!reflection) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading reflection...</Text>
      </SafeAreaView>
    );
  }

  const getToneColor = () => {
    switch (reflection.emotionalTone) {
      case 'celebratory':
        return '#238636';
      case 'warning':
        return '#D29922';
      case 'challenging':
        return '#DA3633';
      default:
        return '#58A6FF';
    }
  };

  const getToneLabel = () => {
    return reflection.emotionalTone.charAt(0).toUpperCase() + reflection.emotionalTone.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Reflection</Text>
          <View style={[styles.toneBadge, { backgroundColor: getToneColor() + '20' }]}>
            <Text style={[styles.toneText, { color: getToneColor() }]}>
              {getToneLabel()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Happened</Text>
          <Text style={styles.bodyText}>{reflection.whatHappened}</Text>
        </View>

        {reflection.keyInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            {reflection.keyInsights.map((insight, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {reflection.misalignmentsDetected.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#F85149' }]}>
              Misalignments Detected
            </Text>
            {reflection.misalignmentsDetected.map((misalignment, index) => (
              <View key={index} style={[styles.listItem, styles.warningItem]}>
                <Text style={[styles.bullet, { color: '#F85149' }]}>⚠</Text>
                <Text style={[styles.listText, { color: '#FFA198' }]}>{misalignment}</Text>
              </View>
            ))}
          </View>
        )}

        {reflection.conflictsWithIdentity.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#F85149' }]}>
              Conflicts with Future Identity
            </Text>
            {reflection.conflictsWithIdentity.map((conflict, index) => (
              <View key={index} style={styles.conflictBox}>
                <Text style={styles.conflictBehavior}>"{conflict.behavior}"</Text>
                <Text style={styles.conflictContradicts}>
                  Contradicts: {conflict.contradicts}
                </Text>
                <View style={[
                  styles.severityBadge,
                  conflict.severity === 'high' && styles.severityHigh,
                  conflict.severity === 'medium' && styles.severityMedium,
                ]}>
                  <Text style={styles.severityText}>
                    {conflict.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {reflection.recommendedActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {reflection.recommendedActions.map((action, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bullet, { color: '#238636' }]}>→</Text>
                <Text style={[styles.listText, { color: '#7EE787' }]}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        {reflection.progressIndicators.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Indicators</Text>
            {reflection.progressIndicators.map((indicator, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{indicator}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  loadingText: {
    color: '#8B949E',
    textAlign: 'center',
    marginTop: 100,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toneBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C9D1D9',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: '#8B949E',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: '#8B949E',
    marginRight: 8,
    fontSize: 16,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  warningItem: {
    backgroundColor: '#2A1A1A',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F85149',
  },
  conflictBox: {
    backgroundColor: '#21262D',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F85149',
  },
  conflictBehavior: {
    fontSize: 15,
    color: '#FFA198',
    fontWeight: '500',
    marginBottom: 8,
  },
  conflictContradicts: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#6E7681',
  },
  severityHigh: {
    backgroundColor: '#DA3633',
  },
  severityMedium: {
    backgroundColor: '#D29922',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#238636',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
