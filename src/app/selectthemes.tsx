import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, FlatList, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, Colors, ThemeType } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const THEMES: { id: ThemeType | 'system'; name: string; description: string }[] = [
  { id: 'system', name: 'Default', description: 'Follow system appearance' },
  { id: 'cinema', name: 'Cinema', description: 'Red carpet dark mode' },
  { id: 'library', name: 'Library', description: 'Classic paper & ink' },
  { id: 'vinyl', name: 'Vinyl', description: 'Deep groove black & green' },
  { id: 'arcade', name: 'Arcade', description: '8-bit neon glow' },
  { id: 'garage', name: 'Garage', description: 'Industrial grey & amber' },
  { id: 'atlas', name: 'Atlas', description: 'Map-inspired clean blue' },
  { id: 'kitchen', name: 'Kitchen', description: 'Crisp & clean emerald' },
  { id: 'stadium', name: 'Stadium', description: 'Pitch green & trophy gold' },
  { id: 'titanium', name: 'Titanium', description: 'Sleek metal finish' },
  { id: 'cosmic', name: 'Cosmic', description: 'Deep space purple' },
];

export default function SelectThemeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeType | 'system'>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSelectedTheme = async () => {
      try {
        setLoading(true);
        // Try DB first
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('selected_theme')
            .eq('id', user.id)
            .single();
          
          if (data?.selected_theme) {
            setSelectedThemeId(data.selected_theme as ThemeType | 'system');
            setLoading(false);
            return;
          }
        }

        // Fallback to AsyncStorage
        const savedTheme = await AsyncStorage.getItem('user-theme');
        if (savedTheme) {
          setSelectedThemeId(savedTheme as ThemeType | 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSelectedTheme();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/premiumprivileges');
    }
  };

  const handleSelectTheme = async (id: ThemeType | 'system') => {
    try {
      if (id === 'system') {
        await AsyncStorage.removeItem('user-theme');
      } else {
        await AsyncStorage.setItem('user-theme', id);
      }
      setSelectedThemeId(id);

      // Save to DB for premium users
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_theme: id })
          .eq('id', user.id);
      }
      
      if (Platform.OS === 'web') {
        window.location.reload(); // Hard refresh to apply theme globally via useTheme hook
      } else {
        Alert.alert('Theme Updated', 'Please restart the app to see full changes if they don\'t appear immediately.', [
          { text: 'OK', onPress: () => router.replace('/settings') }
        ]);
      }
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const renderThemeItem = ({ item }: { item: typeof THEMES[0] }) => {
    const isSelected = selectedThemeId === item.id;
    const previewColors = item.id === 'system' ? Colors.light : Colors[item.id as ThemeType];

    return (
      <TouchableOpacity
        style={[
          styles.themeItem,
          { backgroundColor: theme.backgroundElement },
          isSelected && { borderColor: theme.brand, borderWidth: 2 }
        ]}
        onPress={() => handleSelectTheme(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.previewContainer, { backgroundColor: previewColors.background }]}>
          <View style={[styles.previewElement, { backgroundColor: previewColors.brand }]} />
          <View style={[styles.previewText, { backgroundColor: previewColors.text }]} />
          <View style={[styles.previewText, { backgroundColor: previewColors.textSecondary, width: '60%' }]} />
        </View>
        <ThemedText style={styles.themeName}>{item.name}</ThemedText>
        <ThemedText style={styles.themeDescription}>{item.description}</ThemedText>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.brand }]}>
            <Ionicons name="checkmark" size={16} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Select Theme</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={THEMES}
            renderItem={renderThemeItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <ThemedText style={styles.description}>
                Personalize your experience with one of our Premium themes.
              </ThemedText>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  backButton: {
    padding: 4,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: Spacing.six,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  themeItem: {
    width: '48%',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewContainer: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    padding: 8,
    marginBottom: Spacing.two,
    justifyContent: 'center',
    gap: 4,
  },
  previewElement: {
    width: 30,
    height: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  previewText: {
    width: '80%',
    height: 4,
    borderRadius: 2,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeDescription: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
