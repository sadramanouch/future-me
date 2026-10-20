/**
 * MoodSelector - Pre-chat mood check-in modal
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { hapticLight } from '../utils/haptics';

const MOODS = [
  { key: 'energized', emoji: '⚡', label: 'Energized' },
  { key: 'calm', emoji: '😌', label: 'Calm' },
  { key: 'anxious', emoji: '😰', label: 'Anxious' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'frustrated', emoji: '😤', label: 'Frustrated' },
] as const;

interface MoodSelectorProps {
  visible: boolean;
  onSelect: (mood: string) => void;
  onSkip: () => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ visible, onSelect, onSkip }) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>How are you feeling?</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            This helps your future self adapt
          </Text>

          <View style={styles.moodGrid}>
            {MOODS.map(mood => (
              <TouchableOpacity
                key={mood.key}
                style={[styles.moodButton, { borderColor: colors.border }]}
                onPress={() => { hapticLight(); onSelect(mood.key); }}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, { color: colors.textSecondary }]}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  moodButton: {
    width: 90,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 14,
  },
});
