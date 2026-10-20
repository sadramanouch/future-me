/**
 * MultiSelectChips Component
 * Chip-based multi-select for onboarding
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hapticLight } from '../../utils/haptics';

interface MultiSelectChipsProps {
  label?: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  hint?: string;
}

export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  label,
  options,
  selectedValues,
  onToggle,
  hint,
}) => {
  const isSelected = (option: string) => selectedValues.includes(option);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {hint && <Text style={styles.hint}>{hint}</Text>}

      <View style={styles.chipsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected(option) && styles.chipSelected]}
            onPress={() => { hapticLight(); onToggle(option); }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isSelected(option) && styles.chipTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9D1D9',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#8B949E',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
  },
  chipSelected: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  chipText: {
    fontSize: 14,
    color: '#C9D1D9',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
