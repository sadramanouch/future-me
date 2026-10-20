/**
 * BeliefSelector Component
 * Category-based belief selection with custom input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

interface BeliefSelectorProps {
  category: string;
  options: string[];
  selectedValues: string[];
  customValues?: string[];
  onToggle: (value: string) => void;
  onAddCustom: (value: string) => void;
}

export const BeliefSelector: React.FC<BeliefSelectorProps> = ({
  category,
  options,
  selectedValues,
  customValues = [],
  onToggle,
  onAddCustom,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const isSelected = (option: string) =>
    selectedValues.includes(option) || customValues.includes(option);

  const handleAddCustom = () => {
    if (customText.trim()) {
      onAddCustom(customText.trim());
      setCustomText('');
      setShowCustomInput(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.categoryTitle}>{category}</Text>

      <View style={styles.beliefsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.beliefItem, isSelected(option) && styles.beliefItemSelected]}
            onPress={() => onToggle(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.beliefText,
                isSelected(option) && styles.beliefTextSelected,
              ]}
            >
              {option}
            </Text>
            {isSelected(option) && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        {customValues.map((custom) => (
          <TouchableOpacity
            key={custom}
            style={[styles.beliefItem, styles.beliefItemSelected, styles.customItem]}
            onPress={() => onToggle(custom)}
            activeOpacity={0.7}
          >
            <Text style={[styles.beliefText, styles.beliefTextSelected]}>
              {custom}
            </Text>
            <Text style={styles.checkmark}>✓</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCustomInput ? (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Type your own belief..."
            placeholderTextColor="#6E7681"
            autoFocus
            onSubmitEditing={handleAddCustom}
            returnKeyType="done"
          />
          <View style={styles.customButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCustomInput(false);
                setCustomText('');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addButton,
                !customText.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddCustom}
              disabled={!customText.trim()}
            >
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomInput(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addCustomText}>+ Add your own</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  beliefsContainer: {
    gap: 8,
  },
  beliefItem: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  beliefItemSelected: {
    backgroundColor: '#1B4F28',
    borderColor: '#238636',
  },
  customItem: {
    borderStyle: 'dashed',
  },
  beliefText: {
    fontSize: 15,
    color: '#C9D1D9',
    flex: 1,
    lineHeight: 22,
  },
  beliefTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#238636',
    marginLeft: 12,
    fontWeight: '600',
  },
  addCustomButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomText: {
    fontSize: 14,
    color: '#58A6FF',
    fontWeight: '500',
  },
  customInputContainer: {
    marginTop: 8,
  },
  customInput: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#58A6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  customButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    color: '#8B949E',
  },
  addButton: {
    backgroundColor: '#238636',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#1B4F28',
  },
  addText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
