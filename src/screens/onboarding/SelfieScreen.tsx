/**
 * SelfieScreen - Capture profile photo during onboarding
 * Photo will be aged to match the future self's age after signup
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboarding } from '../../context/OnboardingContext';
import { ProgressBar } from '../../components/onboarding';
import { calculateFutureAge } from '../../types/Onboarding';

const PROFILE_IMAGE_KEY = '@future_you:profile_image';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const SelfieScreen: React.FC<Props> = ({ navigation }) => {
  const { progress, setBasicData, progressPercentage } = useOnboarding();
  const [photoUri, setPhotoUri] = useState<string | null>(
    progress.basicData.profilePicture || null
  );

  // Calculate ages for display
  const dob = progress.basicData.dateOfBirth;
  const currentAge = dob ? (() => {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  })() : null;
  const futureAge = currentAge ? calculateFutureAge(currentAge) : null;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setBasicData({ profilePicture: uri });
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setBasicData({ profilePicture: uri });
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
    }
  };

  const handleContinue = () => {
    navigation.navigate('OnboardingChapter', { chapter: 'pickIdentity' });
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingChapter', { chapter: 'pickIdentity' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={progressPercentage} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.main,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.title}>Show us you</Text>
          <Text style={styles.subtitle}>
            {futureAge
              ? `We'll transform this into what you look like at ${futureAge}`
              : 'Take a selfie to give your future self a face'}
          </Text>

          {/* Photo preview / placeholder */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <View style={styles.photoCard}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <Text style={styles.photoLabel}>You now</Text>
                </View>
                <View style={styles.photoArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={[styles.photoCard, styles.futurePhotoCard]}>
                  <Image
                    source={{ uri: photoUri }}
                    style={[styles.photoPreview, styles.futurePhotoPreview]}
                  />
                  <Text style={[styles.photoLabel, styles.futurePhotoLabel]}>
                    Future You
                  </Text>
                  <View style={styles.shimmerOverlay} />
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.placeholderIcon}>📸</Text>
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
              <Text style={styles.primaryButtonText}>Take a Selfie</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={pickFromLibrary}>
              <Text style={styles.secondaryButtonText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>

          {/* Continue / Skip */}
          {photoUri ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  main: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  photoSection: {
    marginBottom: 36,
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#21262D',
    borderWidth: 2,
    borderColor: '#30363D',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCard: {
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  futurePhotoCard: {
    backgroundColor: '#1B4F28',
    borderColor: '#238636',
  },
  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  futurePhotoPreview: {
    opacity: 0.7,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 28,
    borderRadius: 55,
    backgroundColor: 'rgba(126, 231, 135, 0.08)',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B949E',
    marginTop: 8,
  },
  futurePhotoLabel: {
    color: '#7EE787',
  },
  photoArrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 24,
    color: '#58A6FF',
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#238636',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#C9D1D9',
  },
  continueButton: {
    backgroundColor: '#58A6FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipText: {
    fontSize: 15,
    color: '#6E7681',
    textDecorationLine: 'underline',
  },
});
