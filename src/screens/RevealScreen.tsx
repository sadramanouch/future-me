/**
 * RevealScreen
 * Builds excitement before user meets their Future Self
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StorageService } from '../services/Storage';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RevealScreen: React.FC<Props> = ({ navigation }) => {
  const [futureName, setFutureName] = useState('Future You');
  const [futureAge, setFutureAge] = useState<number | null>(null);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFutureSelf();
    startAnimations();
  }, []);

  const loadFutureSelf = async () => {
    try {
      const futureSelf = await StorageService.getFutureSelf();
      if (futureSelf) {
        setFutureName(futureSelf.coreIdentity.name);
        setFutureAge(futureSelf.coreIdentity.currentAge + futureSelf.coreIdentity.yearsAhead);
      }
    } catch (error) {
      console.error('Error loading future self:', error);
    }
  };

  const startAnimations = () => {
    // Dramatic entrance sequence
    Animated.sequence([
      // Backdrop fades in
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Glow effect appears
      Animated.parallel([
        Animated.spring(glowScale, {
          toValue: 1,
          tension: 10,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      // Subtitle appears
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      // Message appears
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(300),
      // Button appears
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Start pulsing animation for button
      startPulse();
    });
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleMeetFutureSelf = () => {
    navigation.replace('Chat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowCircle,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        <View style={styles.content}>
          {/* Ready label */}
          <Animated.View style={{ opacity: subtitleOpacity }}>
            <Text style={styles.readyLabel}>GET READY</Text>
          </Animated.View>

          {/* Main title */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            }}
          >
            <Text style={styles.title}>Meet</Text>
            <Text style={styles.titleHighlight}>{futureName}</Text>
            {futureAge && (
              <Text style={styles.ageText}>Age {futureAge}</Text>
            )}
          </Animated.View>

          {/* Message */}
          <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
            <Text style={styles.message}>
              Your future self has been waiting to talk to you.
            </Text>
            <Text style={styles.submessage}>
              They know your journey, your dreams, and what's possible.
            </Text>
          </Animated.View>
        </View>

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [
                { scale: Animated.multiply(buttonScale, pulseValue) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleMeetFutureSelf}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>START CONVERSATION</Text>
          </TouchableOpacity>
          <Text style={styles.buttonHint}>Tap to begin</Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#238636',
    opacity: 0.15,
    top: height * 0.15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  readyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58A6FF',
    letterSpacing: 4,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleHighlight: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#238636',
    textAlign: 'center',
    marginTop: 4,
  },
  messageContainer: {
    marginTop: 48,
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    color: '#C9D1D9',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  submessage: {
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#238636',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#238636',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  buttonHint: {
    fontSize: 13,
    color: '#8B949E',
    marginTop: 12,
  },
});

export default RevealScreen;
