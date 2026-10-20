/**
 * EditProfileScreen - Edit the Future Self profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/Storage';
import { AuthService } from '../services/AuthService';
import { FutureSelfModel } from '../types/FutureSelf';

const PROFILE_IMAGE_KEY = '@future_you:profile_image';
const AGED_IMAGE_KEY = '@future_you:aged_image';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TONE_OPTIONS = ['calm', 'direct', 'reflective', 'challenging', 'balanced'] as const;
const APPROACH_OPTIONS = ['socratic', 'advisory', 'confrontational', 'balanced'] as const;

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmButton = buttons.find((b: any) => b.style !== 'cancel' && b.text !== 'Cancel');
        confirmButton?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  }
};

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [profile, setProfile] = useState<FutureSelfModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [agedImage, setAgedImage] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [yearsAhead, setYearsAhead] = useState('5');
  const [identityStatement, setIdentityStatement] = useState('');
  const [dominantTraits, setDominantTraits] = useState('');
  const [coreValues, setCoreValues] = useState('');
  const [nonNegotiables, setNonNegotiables] = useState('');
  const [aspirationalValues, setAspirationalValues] = useState('');
  const [tone, setTone] = useState<typeof TONE_OPTIONS[number]>('balanced');
  const [approach, setApproach] = useState<typeof APPROACH_OPTIONS[number]>('balanced');
  const [directness, setDirectness] = useState(7);
  const [empathy, setEmpathy] = useState(6);
  const [purposeStatement, setPurposeStatement] = useState('');
  const [worldview, setWorldview] = useState('');
  const [principles, setPrinciples] = useState('');
  const [viewOnSuffering, setViewOnSuffering] = useState('');
  const [viewOnSuccess, setViewOnSuccess] = useState('');
  const [personalStandards, setPersonalStandards] = useState('');
  const [boundaries, setBoundaries] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const fs = await StorageService.getFutureSelf();
      if (!fs) {
        navigation.goBack();
        return;
      }
      setProfile(fs);

      // Load profile images
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImage) setProfileImage(savedImage);
      const savedAged = await AsyncStorage.getItem(AGED_IMAGE_KEY);
      if (savedAged) setAgedImage(savedAged);

      // Populate fields
      setName(fs.coreIdentity.name || '');
      setYearsAhead(String(fs.coreIdentity.yearsAhead || 5));
      setIdentityStatement(fs.coreIdentity.identityStatement || '');
      setDominantTraits(fs.coreIdentity.dominantTraits?.join(', ') || '');
      setCoreValues(fs.values.core?.join(', ') || '');
      setNonNegotiables(fs.values.nonNegotiables?.join(', ') || '');
      setAspirationalValues(fs.values.aspirational?.join(', ') || '');
      setTone(fs.communicationStyle.tone || 'balanced');
      setApproach(fs.communicationStyle.approach || 'balanced');
      setDirectness(fs.communicationStyle.directnessLevel || 7);
      setEmpathy(fs.communicationStyle.empathyLevel || 6);
      setPurposeStatement(fs.lifePhilosophy?.purposeStatement || '');
      setWorldview(fs.lifePhilosophy?.worldview || '');
      setPrinciples(fs.lifePhilosophy?.principlesForLiving?.join('\n') || '');
      setViewOnSuffering(fs.lifePhilosophy?.viewOnSuffering || '');
      setViewOnSuccess(fs.lifePhilosophy?.viewOnSuccess || '');
      setPersonalStandards(fs.standardsAndBoundaries?.personalStandards?.join('\n') || '');
      setBoundaries(fs.standardsAndBoundaries?.boundaries?.join('\n') || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
      // Clear old aged image since photo changed
      setAgedImage(null);
      await AsyncStorage.removeItem(AGED_IMAGE_KEY);
    }
  };

  const removeImage = async () => {
    setProfileImage(null);
    setAgedImage(null);
    await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
    await AsyncStorage.removeItem(AGED_IMAGE_KEY);
  };

  const pickFutureImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAgedImage(uri);
      await AsyncStorage.setItem(AGED_IMAGE_KEY, uri);
    }
  };

  const removeFutureImage = async () => {
    setAgedImage(null);
    await AsyncStorage.removeItem(AGED_IMAGE_KEY);
  };

  const splitCommas = (text: string): string[] =>
    text.split(',').map(s => s.trim()).filter(Boolean);

  const splitLines = (text: string): string[] =>
    text.split('\n').map(s => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const years = parseInt(yearsAhead) || 5;
      const updatedProfile: FutureSelfModel = {
        ...profile,
        lastUpdated: new Date().toISOString(),
        coreIdentity: {
          ...profile.coreIdentity,
          name: name.trim() || profile.coreIdentity.name,
          yearsAhead: years,
          age: profile.coreIdentity.currentAge + years,
          identityStatement: identityStatement.trim(),
          dominantTraits: splitCommas(dominantTraits),
        },
        values: {
          core: splitCommas(coreValues),
          nonNegotiables: splitCommas(nonNegotiables),
          aspirational: splitCommas(aspirationalValues),
        },
        communicationStyle: {
          ...profile.communicationStyle,
          tone,
          approach,
          directnessLevel: directness,
          empathyLevel: empathy,
        },
        lifePhilosophy: {
          worldview: worldview.trim(),
          purposeStatement: purposeStatement.trim(),
          principlesForLiving: splitLines(principles),
          viewOnSuffering: viewOnSuffering.trim(),
          viewOnSuccess: viewOnSuccess.trim(),
        },
        standardsAndBoundaries: {
          ...profile.standardsAndBoundaries,
          personalStandards: splitLines(personalStandards),
          boundaries: splitLines(boundaries),
        },
      };

      await StorageService.saveImmutableMemory(updatedProfile);

      // Also save to backend if authenticated
      try {
        await AuthService.saveProfile(updatedProfile);
      } catch {}

      showAlert('Saved', 'Your profile has been updated. The AI will now reflect these changes.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#58A6FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#238636" size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Profile Pictures */}
        <View style={styles.pictureSection}>
          <View style={styles.photoRow}>
            {/* Your photo */}
            <View style={styles.photoColumn}>
              <TouchableOpacity onPress={pickImage} style={styles.pictureWrapper}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageInitial}>
                      {name?.charAt(0)?.toUpperCase() || 'F'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Text style={styles.cameraIcon}>+</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.pictureLabel}>You now</Text>
            </View>

            {/* Future self photo */}
            <View style={styles.photoColumn}>
              <TouchableOpacity onPress={pickFutureImage} style={styles.pictureWrapper}>
                {agedImage ? (
                  <Image source={{ uri: agedImage }} style={[styles.profileImage, styles.agedImage]} />
                ) : (
                  <View style={[styles.profileImagePlaceholder, styles.agedPlaceholder]}>
                    <Text style={styles.profileImageInitial}>?</Text>
                  </View>
                )}
                <View style={[styles.cameraOverlay, styles.agedCameraOverlay]}>
                  <Text style={styles.cameraIcon}>+</Text>
                </View>
              </TouchableOpacity>
              <Text style={[styles.pictureLabel, styles.agedLabel]}>Future You</Text>
            </View>
          </View>

          <Text style={styles.pictureLabel}>Tap either photo to change it</Text>

          <View style={styles.photoActions}>
            {profileImage && (
              <TouchableOpacity onPress={removeImage}>
                <Text style={styles.removePhotoText}>Remove your photo</Text>
              </TouchableOpacity>
            )}
            {agedImage && (
              <TouchableOpacity onPress={removeFutureImage}>
                <Text style={styles.removePhotoText}>Remove future photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Core Identity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CORE IDENTITY</Text>

          <Text style={styles.label}>Future Self Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name of your future self"
            placeholderTextColor="#6E7681"
          />

          <Text style={styles.label}>Years Ahead</Text>
          <TextInput
            style={styles.input}
            value={yearsAhead}
            onChangeText={setYearsAhead}
            placeholder="5"
            placeholderTextColor="#6E7681"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Identity Statement</Text>
          <Text style={styles.hint}>"I am someone who..."</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={identityStatement}
            onChangeText={setIdentityStatement}
            placeholder="I am someone who follows through on commitments..."
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>Dominant Traits</Text>
          <Text style={styles.hint}>Comma separated (e.g. disciplined, introspective, direct)</Text>
          <TextInput
            style={styles.input}
            value={dominantTraits}
            onChangeText={setDominantTraits}
            placeholder="disciplined, introspective, direct"
            placeholderTextColor="#6E7681"
          />
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VALUES</Text>

          <Text style={styles.label}>Core Values</Text>
          <Text style={styles.hint}>Comma separated</Text>
          <TextInput
            style={styles.input}
            value={coreValues}
            onChangeText={setCoreValues}
            placeholder="integrity, growth, autonomy"
            placeholderTextColor="#6E7681"
          />

          <Text style={styles.label}>Non-Negotiables</Text>
          <Text style={styles.hint}>What you will never compromise on</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={nonNegotiables}
            onChangeText={setNonNegotiables}
            placeholder="honesty, health, family time"
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>Aspirational Values</Text>
          <Text style={styles.hint}>Values you're growing into</Text>
          <TextInput
            style={styles.input}
            value={aspirationalValues}
            onChangeText={setAspirationalValues}
            placeholder="patience, leadership, generosity"
            placeholderTextColor="#6E7681"
          />
        </View>

        {/* Communication Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI COMMUNICATION STYLE</Text>
          <Text style={styles.sectionHint}>Controls how the AI talks to you</Text>

          <Text style={styles.label}>Tone</Text>
          <View style={styles.chipRow}>
            {TONE_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, tone === t && styles.chipSelected]}
                onPress={() => setTone(t)}
              >
                <Text style={[styles.chipText, tone === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Approach</Text>
          <View style={styles.chipRow}>
            {APPROACH_OPTIONS.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, approach === a && styles.chipSelected]}
                onPress={() => setApproach(a)}
              >
                <Text style={[styles.chipText, approach === a && styles.chipTextSelected]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Directness: {directness}/10</Text>
          <Text style={styles.hint}>How blunt the AI should be</Text>
          <View style={styles.sliderRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.sliderDot, directness >= n && styles.sliderDotActive]}
                onPress={() => setDirectness(n)}
              />
            ))}
          </View>

          <Text style={styles.label}>Empathy: {empathy}/10</Text>
          <Text style={styles.hint}>How much warmth vs tough love</Text>
          <View style={styles.sliderRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.sliderDot, empathy >= n && styles.sliderDotActive]}
                onPress={() => setEmpathy(n)}
              />
            ))}
          </View>
        </View>

        {/* Life Philosophy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIFE PHILOSOPHY</Text>

          <Text style={styles.label}>Worldview</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={worldview}
            onChangeText={setWorldview}
            placeholder="Core belief about how the world works..."
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>Purpose Statement</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={purposeStatement}
            onChangeText={setPurposeStatement}
            placeholder="My purpose is to..."
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>Guiding Principles</Text>
          <Text style={styles.hint}>One per line</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={principles}
            onChangeText={setPrinciples}
            placeholder={"Do hard things first\nNever lie to yourself\nProgress over perfection"}
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>View on Suffering</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={viewOnSuffering}
            onChangeText={setViewOnSuffering}
            placeholder="What role does struggle play in growth?"
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>View on Success</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={viewOnSuccess}
            onChangeText={setViewOnSuccess}
            placeholder="What does real success mean to you?"
            placeholderTextColor="#6E7681"
            multiline
          />
        </View>

        {/* Standards & Boundaries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STANDARDS & BOUNDARIES</Text>

          <Text style={styles.label}>Personal Standards</Text>
          <Text style={styles.hint}>One per line (e.g. "I finish what I start")</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={personalStandards}
            onChangeText={setPersonalStandards}
            placeholder={"I don't make excuses\nI finish what I start\nI show up even when I don't feel like it"}
            placeholderTextColor="#6E7681"
            multiline
          />

          <Text style={styles.label}>Boundaries</Text>
          <Text style={styles.hint}>One per line</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={boundaries}
            onChangeText={setBoundaries}
            placeholder={"I protect my mornings\nI don't tolerate disrespect\nI say no to things that drain me"}
            placeholderTextColor="#6E7681"
            multiline
          />
        </View>

        {/* Save Button at bottom */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  backText: {
    fontSize: 16,
    color: '#8B949E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#238636',
  },
  scrollContent: {
    padding: 20,
  },
  pictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pictureWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#238636',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#238636',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#30363D',
  },
  profileImageInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#58A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F1419',
  },
  cameraIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pictureLabel: {
    fontSize: 13,
    color: '#8B949E',
  },
  removePhotoText: {
    fontSize: 13,
    color: '#F85149',
    marginTop: 4,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 8,
  },
  photoColumn: {
    alignItems: 'center',
  },
  agedImage: {
    borderColor: '#7EE787',
  },
  agedPlaceholder: {
    backgroundColor: '#1B4F28',
    borderColor: '#238636',
  },
  agedLabel: {
    color: '#7EE787',
  },
  photoActions: {
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  agedCameraOverlay: {
    backgroundColor: '#238636',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58A6FF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  sectionHint: {
    fontSize: 13,
    color: '#8B949E',
    marginTop: -12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9D1D9',
    marginBottom: 4,
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6E7681',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  chipText: {
    fontSize: 13,
    color: '#8B949E',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sliderDotActive: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  saveButton: {
    backgroundColor: '#238636',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#1B4F28',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;
