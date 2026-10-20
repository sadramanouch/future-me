/**
 * ThemeContext - Dark/Light theme support
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@future_you:theme';

export interface ColorScheme {
  // Backgrounds
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgInput: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;

  // Borders
  border: string;
  borderLight: string;

  // Accents (shared)
  accent: string;       // #238636 green
  accentDim: string;    // dimmed green
  accentBlue: string;   // #58A6FF
  accentRed: string;    // #F85149

  // Messages
  userBubble: string;
  assistantBubble: string;
  assistantBubbleBorder: string;

  // Status
  onlineGreen: string;
}

const dark: ColorScheme = {
  bg: '#0F1419',
  bgSecondary: '#161B22',
  bgTertiary: '#1C2128',
  bgInput: '#0D1117',
  text: '#FFFFFF',
  textSecondary: '#C9D1D9',
  textMuted: '#8B949E',
  textPlaceholder: '#6E7681',
  border: '#30363D',
  borderLight: '#21262D',
  accent: '#238636',
  accentDim: '#1B4F28',
  accentBlue: '#58A6FF',
  accentRed: '#F85149',
  userBubble: '#238636',
  assistantBubble: '#1C2128',
  assistantBubbleBorder: '#30363D',
  onlineGreen: '#3FB950',
};

const light: ColorScheme = {
  bg: '#FFFFFF',
  bgSecondary: '#F6F8FA',
  bgTertiary: '#F0F2F5',
  bgInput: '#FFFFFF',
  text: '#1F2328',
  textSecondary: '#424A53',
  textMuted: '#656D76',
  textPlaceholder: '#8B949E',
  border: '#D0D7DE',
  borderLight: '#E8EBF0',
  accent: '#238636',
  accentDim: '#DAFBE1',
  accentBlue: '#0969DA',
  accentRed: '#CF222E',
  userBubble: '#238636',
  assistantBubble: '#F6F8FA',
  assistantBubbleBorder: '#D0D7DE',
  onlineGreen: '#1A7F37',
};

interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: dark,
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(value => {
      if (value === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ colors: isDark ? dark : light, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
