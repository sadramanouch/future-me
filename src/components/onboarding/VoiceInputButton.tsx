/**
 * VoiceInputButton Component
 * Microphone button for voice-to-text input
 *
 * - iOS/Android: Uses @react-native-voice/voice (native SFSpeechRecognizer/SpeechRecognizer)
 * - Web: Uses Web Speech API (browser's built-in speech recognition)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  View,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';

// Safe import - Voice is only available on native platforms
let Voice: any = null;

// Only import on native platforms
if (Platform.OS !== 'web') {
  try {
    const voiceModule = require('@react-native-voice/voice');
    Voice = voiceModule.default;
  } catch (e) {
    Voice = null;
  }
}

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const webRecognitionRef = useRef<any>(null);

  // Check availability and set up listeners
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check for Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsAvailable(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            onTranscript(transcript);
          }
          setIsListening(false);
        };

        webRecognitionRef.current = recognition;
      } else {
        setIsAvailable(false);
      }
      return;
    }

    // Native platform setup
    if (!Voice) {
      setIsAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      try {
        const available = await Voice.isAvailable();
        setIsAvailable(!!available);
      } catch (e) {
        setIsAvailable(false);
      }
    };
    checkAvailability();

    // Set up voice event handlers
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (event: any) => {
      if (event.value && event.value.length > 0) {
        const transcript = event.value[0];
        if (transcript) {
          onTranscript(transcript);
        }
      }
      setIsListening(false);
    };
    Voice.onSpeechError = () => setIsListening(false);

    // Cleanup
    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      }
    };
  }, [onTranscript]);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  // Request microphone permission on Android
  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice input.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handlePress = async () => {
    // Web Speech API
    if (Platform.OS === 'web') {
      if (!webRecognitionRef.current) return;

      if (isListening) {
        webRecognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          webRecognitionRef.current.start();
        } catch (e) {
          console.error('Web speech error:', e);
          setIsListening(false);
        }
      }
      return;
    }

    // Native Voice
    if (!Voice) return;

    if (isListening) {
      try {
        await Voice.stop();
      } catch (e) {
        console.error('Error stopping voice:', e);
      }
      setIsListening(false);
      return;
    }

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable microphone access in Settings to use voice input.'
      );
      return;
    }

    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error('Error starting voice:', e);
      Alert.alert('Voice Error', 'Unable to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  // Don't render if not available or disabled
  if (disabled || !isAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening && styles.buttonListening,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{isListening ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
      </Animated.View>
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonListening: {
    backgroundColor: '#3D1A1A',
    borderColor: '#F85149',
  },
  icon: {
    fontSize: 20,
  },
  listeningText: {
    fontSize: 11,
    color: '#F85149',
    marginTop: 4,
    fontWeight: '500',
  },
});
