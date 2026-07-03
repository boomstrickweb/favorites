import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, Image, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { findSoulmates } from '@/lib/api';
import { Spacing, MaxContentWidth } from '@/constants/theme';

const CATEGORIES = [
  { id: 'all', label: 'All Categories', table: undefined },
  { id: 'movie', label: 'Movies', table: 'movie_favorites' },
  { id: 'music', label: 'Music', table: 'music_favorites' },
  { id: 'book', label: 'Books', table: 'book_favorites' },
  { id: 'sports', label: 'Sports', table: 'sports_favorites' },
  { id: 'food', label: 'Food', table: 'food_favorites' },
  { id: 'places', label: 'Places', table: 'places_favorites' },
  { id: 'vehicle', label: 'Vehicles', table: 'vehicle_favorites' },
  { id: 'game', label: 'Games', table: 'games_favorites' },
];

export default function FindSoulmateScreen() {
  const { category: initialCategoryTable } = useLocalSearchParams<{ category: string }>();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [soulmates, setSoulmates] = useState<{ user: any; matchPercentage: number }[]>([]);
  const [minPercentage, setMinPercentage] = useState('50');
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIES.find(c => c.table === initialCategoryTable) || CATEGORIES[0]
  );

  const loadSoulmates = useCallback(async (percentage: number, categoryTable?: string) => {
    try {
      setLoading(true);
      const results = await findSoulmates(percentage, categoryTable);
      setSoulmates(results);
    } catch (error) {
      console.error('Failed to load soulmates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const percentage = parseInt(minPercentage) || 0;
    loadSoulmates(percentage, selectedCategory.table);
  }, [selectedCategory, minPercentage]);

  const handlePercentageChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let val = parseInt(cleaned) || 0;
    if (val > 100) val = 100;
    setMinPercentage(val.toString());
  };

  const handleSearch = () => {
    const val = parseInt(minPercentage) || 0;
    loadSoulmates(val, selectedCategory.table);
  };

  const renderCategoryItem = (category: typeof CATEGORIES[0]) => {
    const isSelected = selectedCategory.id === category.id;
    return (
      <TouchableOpacity
        key={category.id}
        onPress={() => setSelectedCategory(category)}
        style={[
          styles.categoryButton,
          { backgroundColor: isSelected ? theme.brand : theme.backgroundElement, borderColor: theme.border }
        ]}
      >
        <ThemedText style={[styles.categoryButtonText, { color: isSelected ? '#fff' : theme.text }]}>
          {category.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: { user: any; matchPercentage: number } }) => (
    <TouchableOpacity 
      style={[styles.userCard, { backgroundColor: theme.backgroundElement }]}
      onPress={() => router.push({
        pathname: '/compare',
        params: { userId: item.user.id, userName: item.user.full_name || item.user.username }
      })}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          {item.user.avatar_url ? (
            <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.userDetails}>
          <ThemedText type="defaultSemiBold">{item.user.full_name || item.user.username}</ThemedText>
          <ThemedText style={styles.username}>@{item.user.username}</ThemedText>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <View style={[styles.percentageBadge, { backgroundColor: theme.brand }]}>
          <ThemedText style={styles.percentageText}>
            {String(isNaN(item.matchPercentage) ? 0 : item.matchPercentage)}%
          </ThemedText>
        </View>
        <Ionicons name="swap-horizontal" size={20} color={theme.brand} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Find Soulmate</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map(renderCategoryItem)}
          </ScrollView>
        </View>

        <View style={styles.filterContainer}>
          <ThemedText style={styles.filterLabel}>Min Match %:</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            value={minPercentage}
            onChangeText={handlePercentageChange}
            keyboardType="number-pad"
            maxLength={3}
          />
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: theme.brand }]} 
            onPress={handleSearch}
          >
            <ThemedText style={styles.searchButtonText}>Search</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
            <ThemedText style={styles.loadingText}>Searching for your soulmates...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={soulmates}
            renderItem={renderItem}
            keyExtractor={(item) => item.user.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-dislike-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                <ThemedText style={styles.emptyText}>No soulmates found yet.</ThemedText>
                <ThemedText style={styles.emptySubtext}>Try adding more favorites to your collections to find people with similar tastes!</ThemedText>
              </View>
            }
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchButton: {
    paddingHorizontal: Spacing.three,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    marginTop: Spacing.three,
    opacity: 0.7,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 12,
    opacity: 0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.three,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  categoriesContainer: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
