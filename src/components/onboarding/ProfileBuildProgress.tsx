/**
 * ProfileBuildProgress - Visual progress through onboarding sections
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const SECTIONS = [
  { key: 'identity', label: 'Identity', icon: '👤' },
  { key: 'values', label: 'Values', icon: '💎' },
  { key: 'patterns', label: 'Patterns', icon: '🔄' },
  { key: 'inner', label: 'Inner World', icon: '🧠' },
  { key: 'future', label: 'Future', icon: '🎯' },
  { key: 'become', label: 'Become', icon: '✨' },
];

interface ProfileBuildProgressProps {
  completedCount: number; // How many sections are done (0-6)
}

export const ProfileBuildProgress: React.FC<ProfileBuildProgressProps> = ({ completedCount }) => {
  const { colors } = useTheme();
  const anims = useRef(SECTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      150,
      anims.map((anim) =>
        Animated.spring(anim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {SECTIONS.map((section, index) => {
          const isDone = index < completedCount;
          return (
            <Animated.View
              key={section.key}
              style={[
                styles.sectionBox,
                {
                  backgroundColor: isDone ? colors.accentDim : colors.bgTertiary,
                  borderColor: isDone ? colors.accent : colors.border,
                  opacity: anims[index],
                  transform: [{ scale: anims[index] }],
                },
              ]}
            >
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={[styles.sectionLabel, { color: isDone ? colors.accent : colors.textMuted }]}>
                {section.label}
              </Text>
              {isDone && <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  sectionBox: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  sectionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 12,
    fontWeight: '700',
  },
});
