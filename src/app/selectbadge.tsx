import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export const BADGE_STORAGE_KEY = 'user-premium-badge';

export const BADGES = [
  { id: '1', name: 'Elite Heart', icon: 'heart-outline', color: '#B9F2FF' }, // Elite - clean heart
  { id: '2', name: 'Infinite Love', icon: 'infinite-outline', color: '#FFD700' }, // Infinite - gold
  { id: '3', name: 'Radiant Fav', icon: 'sunny-outline', color: '#FFAC33' }, // Radiant - orange
  { id: '4', name: 'Sparkling Heart', icon: 'sparkles-outline', color: '#FFFACD' }, // Sparkling - light yellow
  { id: '5', name: 'Sweet Heart', icon: 'heart-half-outline', color: '#FF69B4' }, // Sweet - Pink
  { id: '6', name: 'Galaxy Love', icon: 'planet-outline', color: '#98FB98' }, // Galaxy - green
  { id: '7', name: 'Circle of Love', icon: 'heart-circle-outline', color: '#0F52BA' }, // Circle - blue
  { id: '8', name: 'Protected Heart', icon: 'shield-checkmark-outline', color: '#9966CC' }, // Protected - purple
];

export default function SelectBadgeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadge();
  }, []);

  const loadBadge = async () => {
    try {
      setLoading(true);
      // Try DB first
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_badge')
          .eq('id', user.id)
          .single();

        if (data?.profile_badge) {
          setSelectedBadge(data.profile_badge);
          setLoading(false);
          return;
        }
      }

      // Fallback to AsyncStorage
      const savedBadge = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
      if (savedBadge) {
        setSelectedBadge(savedBadge);
      }
    } catch (error) {
      console.error('Error loading badge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBadge = async (badgeId: string) => {
    try {
      setSelectedBadge(badgeId);
      await AsyncStorage.setItem(BADGE_STORAGE_KEY, badgeId);

      // Save to DB for premium users
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ profile_badge: badgeId })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving badge:', error);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/premiumprivileges');
    }
  };

  const renderBadgeItem = ({ item }: { item: typeof BADGES[0] }) => {
    const isSelected = selectedBadge === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.badgeItem,
          { backgroundColor: theme.backgroundElement },
          isSelected && { borderColor: theme.brand, borderWidth: 2 }
        ]}
        onPress={() => handleSelectBadge(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.badgeIconContainer}>
          <Ionicons name={item.icon as any} size={40} color={item.color} />
        </View>
        <ThemedText style={styles.badgeName}>{item.name}</ThemedText>
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
          <ThemedText type="subtitle">Select Badge</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={BADGES}
            renderItem={renderBadgeItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <ThemedText style={styles.description}>
                Choose a badge to show off your Premium status on your profile.
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
  badgeItem: {
    width: '48%',
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeIconContainer: {
    marginBottom: Spacing.two,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
