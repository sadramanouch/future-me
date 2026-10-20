import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from './src/services/Storage';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator';
import {
  ChatScreen,
  EditProfileScreen,
  ReflectionScreen,
  RevealScreen,
  ProgressDashboardScreen,
  ConversationHistoryScreen,
  ConversationDetailScreen,
  PaymentGateScreen,
  ReflectionsListScreen,
  MemoryScreen,
} from './src/screens';
import { AuthService } from './src/services/AuthService';

export type RootStackParamList = {
  Onboarding: undefined;
  PaymentGate: undefined;
  Reveal: undefined;
  Chat: undefined;
  EditProfile: undefined;
  Reflection: { reflectionId: string };
  ProgressDashboard: undefined;
  ConversationHistory: undefined;
  ConversationDetail: { sessionId: string };
  ReflectionsList: undefined;
  Memory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // One-time cleanup: remove any previously persisted API key from client storage
      await AsyncStorage.removeItem('@future_you:api_key');

      const hasCompleted = await StorageService.hasCompletedOnboarding();
      if (hasCompleted) {
        // Verify user is actually authenticated before checking payment
        const isAuthed = await AuthService.isAuthenticated();
        if (!isAuthed) {
          // Token missing or invalid — send back to onboarding (AuthChoice → Login)
          setInitialRoute('Onboarding');
        } else {
          const isValid = await AuthService.verifyToken();
          if (!isValid) {
            setInitialRoute('Onboarding');
          } else {
            // Authenticated — check payment status
            const localAccess = await StorageService.hasPaymentAccess();
            if (localAccess) {
              setInitialRoute('Chat');
            } else {
              try {
                const status = await AuthService.getPaymentStatus();
                if (status.hasAccess) {
                  await StorageService.savePaymentStatus(status);
                  setInitialRoute('Chat');
                } else {
                  setInitialRoute('PaymentGate');
                }
              } catch {
                setInitialRoute('PaymentGate');
              }
            }
          }
        }
      } else {
        setInitialRoute('Onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.textSecondary,
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="PaymentGate" component={PaymentGateScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reveal" component={RevealScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ title: 'Reflection' }} />
          <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ConversationHistory" component={ConversationHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ReflectionsList" component={ReflectionsListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Memory" component={MemoryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
