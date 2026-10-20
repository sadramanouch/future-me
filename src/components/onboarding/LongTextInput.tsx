/**
 * LongTextInput Component
 * Multi-line text input with voice-to-text support
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { VoiceInputButton } from './VoiceInputButton';

interface LongTextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
  minHeight?: number;
  autoFocus?: boolean;
  showVoice?: boolean;
}

export const LongTextInput: React.FC<LongTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  minHeight = 140,
  autoFocus = false,
  showVoice = true,
}) => {
  const handleVoiceTranscript = (transcript: string) => {
    // Append to existing text with a space if needed
    const newValue = value
      ? `${value} ${transcript}`
      : transcript;
    onChangeText(newValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
        {showVoice && (
          <VoiceInputButton onTranscript={handleVoiceTranscript} />
        )}
      </View>
      <TextInput
        style={[styles.input, { minHeight }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6E7681"
        multiline
        textAlignVertical="top"
        autoFocus={autoFocus}
        selectionColor="#58A6FF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9D1D9',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
});
