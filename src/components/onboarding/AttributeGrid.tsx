/**
 * AttributeGrid Component
 * Grid layout for selecting personal attributes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hapticLight } from '../../utils/haptics';

interface AttributeGridProps {
  label?: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  hint?: string;
  columns?: number;
}

export const AttributeGrid: React.FC<AttributeGridProps> = ({
  label,
  options,
  selectedValues,
  onToggle,
  hint,
  columns = 3,
}) => {
  const isSelected = (option: string) => selectedValues.includes(option);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {hint && <Text style={styles.hint}>{hint}</Text>}

      <View style={styles.grid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.gridItem,
              { width: `${100 / columns - 2}%` },
              isSelected(option) && styles.gridItemSelected,
            ]}
            onPress={() => { hapticLight(); onToggle(option); }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.gridItemText,
                isSelected(option) && styles.gridItemTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedValues.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedValues.length} selected
        </Text>
      )}
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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemSelected: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  gridItemText: {
    fontSize: 13,
    color: '#C9D1D9',
    fontWeight: '500',
    textAlign: 'center',
  },
  gridItemTextSelected: {
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 12,
    color: '#58A6FF',
    marginTop: 8,
    textAlign: 'center',
  },
});
