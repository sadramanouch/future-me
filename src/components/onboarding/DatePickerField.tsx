/**
 * DatePickerField Component
 * Simple date of birth picker for onboarding
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';

interface DatePickerFieldProps {
  label?: string;
  value: string; // ISO date string
  onChange: (date: string) => void;
  placeholder?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date of birth',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<'month' | 'day' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(currentYear - 25);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);

  // Parse existing value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
    }
  }, []);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setStep('day');
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setStep('year');
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    const date = new Date(year, selectedMonth, selectedDay);
    onChange(date.toISOString());
    setModalVisible(false);
    setStep('month');
  };

  const handleOpenModal = () => {
    setStep('month');
    setModalVisible(true);
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedMonth, selectedYear) },
    (_, i) => i + 1
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.selector}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (step === 'day') setStep('month');
                  else if (step === 'year') setStep('day');
                  else setModalVisible(false);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>
                  {step === 'month' ? 'Cancel' : '← Back'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {step === 'month' && 'Select Month'}
                {step === 'day' && `${months[selectedMonth]}`}
                {step === 'year' && `${months[selectedMonth]} ${selectedDay}`}
              </Text>
              <View style={styles.spacer} />
            </View>

            <ScrollView style={styles.optionsList}>
              {step === 'month' &&
                months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={styles.option}
                    onPress={() => handleSelectMonth(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{month}</Text>
                  </TouchableOpacity>
                ))}

              {step === 'day' &&
                days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={styles.option}
                    onPress={() => handleSelectDay(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{day}</Text>
                  </TouchableOpacity>
                ))}

              {step === 'year' &&
                years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.option}
                    onPress={() => handleSelectYear(year)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{year}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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
  selector: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  placeholder: {
    color: '#6E7681',
  },
  icon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    minWidth: 70,
  },
  backText: {
    fontSize: 16,
    color: '#58A6FF',
  },
  spacer: {
    minWidth: 70,
  },
  optionsList: {
    padding: 8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 18,
    color: '#C9D1D9',
    textAlign: 'center',
  },
});
