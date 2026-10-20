/**
 * HeroScreen
 * First impression - "Future You Knows Best"
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimationDuration, SpringConfig, pulse } from '../../utils/animations';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const HeroScreen: React.FC<Props> = ({ navigation }) => {
  // Animation values for each word
  const wordAnims = useRef([
    new Animated.Value(0), // "Future"
    new Animated.Value(0), // "You"
    new Animated.Value(0), // "Knows"
    new Animated.Value(0), // "Best"
  ]).current;

  // Button animations
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered word entrance
    const wordAnimations = wordAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: AnimationDuration.SLOW,
        delay: index * 200,
        useNativeDriver: true,
      })
    );

    // Sequence: words first, then button
    Animated.sequence([
      Animated.stagger(200, wordAnimations),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: AnimationDuration.NORMAL,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start subtle button pulse after entrance
      pulse(buttonScaleAnim, 0.98, 1.02, 2000).start();
    });
  }, []);

  const handleTalkNow = () => {
    navigation.navigate('JourneyIntro');
  };

  const words = ['Future', 'You', 'Knows', 'Best'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          {words.map((word, index) => (
            <Animated.Text
              key={word}
              style={[
                styles.titleWord,
                index === 1 && styles.titleAccent, // "You" in accent color
                {
                  opacity: wordAnims[index],
                  transform: [
                    {
                      translateY: wordAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {word}
            </Animated.Text>
          ))}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonFadeAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleTalkNow}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>BEGIN</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleWord: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 60,
  },
  titleAccent: {
    color: '#58A6FF',
  },
  spacer: {
    height: 100,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#238636',
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#238636',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
