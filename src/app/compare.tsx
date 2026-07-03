import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { getUserFavorites } from '@/lib/api';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function CompareScreen() {
  const { userId, userName, highlightCategory } = useLocalSearchParams<{ userId: string; userName: string; highlightCategory?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myFavorites, setMyFavorites] = useState<Record<string, { value: string; type?: string; category?: string }[]>>({});
  const [theirFavorites, setTheirFavorites] = useState<Record<string, { value: string; type?: string; category?: string }[]>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [categoryLayouts, setCategoryLayouts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [myFavs, theirFavs] = await Promise.all([
          getUserFavorites(user.id),
          getUserFavorites(userId)
        ]);

        setMyFavorites(myFavs);
        setTheirFavorites(theirFavs);
      } catch (error) {
        console.error('Failed to load favorites for comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  useEffect(() => {
    if (!loading && highlightCategory && categoryLayouts[highlightCategory] !== undefined) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: categoryLayouts[highlightCategory], animated: true });
      }, 500);
    }
  }, [loading, highlightCategory, categoryLayouts]);

  const categories = [
    { key: 'movie_favorites', label: 'Movies', icon: 'film' },
    { key: 'music_favorites', label: 'Music', icon: 'musical-notes' },
    { key: 'book_favorites', label: 'Books', icon: 'book' },
    { key: 'sports_favorites', label: 'Sports', icon: 'trophy' },
    { key: 'food_favorites', label: 'Food', icon: 'restaurant' },
    { key: 'places_favorites', label: 'Places', icon: 'location' },
    { key: 'vehicle_favorites', label: 'Vehicles', icon: 'car' },
    { key: 'games_favorites', label: 'Games', icon: 'game-controller' },
  ];

  const getCollectionMenu = (categoryKey: string) => {
    switch (categoryKey) {
      case 'movie_favorites': return 'Movie Collections';
      case 'music_favorites': return 'Music Collections';
      case 'book_favorites': return 'Book Collections';
      case 'sports_favorites': return 'Sports Collections';
      case 'food_favorites': return 'Food Collections';
      case 'places_favorites': return 'Places Collections';
      case 'vehicle_favorites': return 'Vehicle Collections';
      case 'games_favorites': return 'Game Collections';
      default: return 'Collections';
    }
  };

  const getMenuLabel = (categoryKey: string, item: { type?: string; category?: string }) => {
    if (categoryKey === 'movie_favorites') {
      switch (item.type) {
        case 'genre': return `Favorite Genres (${item.category})`;
        case 'actor': return 'Favorite Actors';
        case 'movie': return 'Favorite Movies';
        case 'tv': return 'Favorite Series';
        default: return 'Movies';
      }
    }
    if (categoryKey === 'music_favorites') {
      switch (item.type) {
        case 'genre': return `Favorite Genres (${item.category})`;
        case 'artist':
        case 'band': return 'Favorite Artists & Bands';
        case 'song':
        case 'album': return 'Favorite Songs & Albums';
        default: return 'Music';
      }
    }
    if (categoryKey === 'sports_favorites') {
      switch (item.type) {
        case 'sport': return 'Favorite Sports';
        case 'team': return 'Favorite Teams';
        case 'player': return 'Favorite Players';
        case 'league': return 'Favorite Leagues';
        default: return 'Sports';
      }
    }
    if (categoryKey === 'food_favorites') {
      switch (item.type) {
        case 'cuisine': return 'Favorite Cuisines';
        case 'dish': return 'Favorite Dishes';
        case 'drink': return 'Favorite Drinks';
        case 'dessert': return 'Favorite Desserts';
        default: return 'Food';
      }
    }
    if (categoryKey === 'places_favorites') {
      switch (item.type) {
        case 'country': return 'Favorite Countries';
        default: return 'Places';
      }
    }
    if (categoryKey === 'book_favorites') {
      switch (item.type) {
        case 'book': return 'Favorite Books';
        case 'author': return 'Favorite Authors';
        case 'genre': return `Favorite Genres (${item.category})`;
        default: return 'Books';
      }
    }
    if (categoryKey === 'vehicle_favorites') {
      switch (item.type) {
        case 'passenger car': return 'Favorite Passenger Cars';
        case 'bus': return 'Favorite Buses';
        case 'multipurpose passenger vehicle (mpv)': return 'Favorite MPVs';
        case 'truck': return 'Favorite Trucks';
        case 'motorcycle': return 'Favorite Motorcycles';
        case 'low speed vehicle (lsv)': return 'Favorite LSVs';
        default: return 'Favorite Vehicles';
      }
    }
    if (categoryKey === 'games_favorites') {
      return 'Favorite Games';
    }
    if (item.category) return item.category;
    return 'General';
  };

  const normalize = (s: any) => {
    if (!s) return '';
    if (typeof s === 'object') {
      return (s.name || s.title || JSON.stringify(s)).trim().toLowerCase();
    }
    return s.toString().trim().toLowerCase();
  };

  const getDisplayName = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.name || value.title || JSON.stringify(value);
    }
    return String(value);
  };

  const renderComparisonSection = (category: typeof categories[0]) => {
    const myItems = myFavorites[category.key] || [];
    const theirItems = theirFavorites[category.key] || [];
    const isHighlighted = highlightCategory === category.key;
    
    // Find common items
    const common = myItems.filter(myItem => 
      theirItems.some(theirItem => normalize(theirItem.value) === normalize(myItem.value))
    );

    if (common.length === 0) return null;

    // Group common items by menu
    const groupedCommon: Record<string, any[]> = {};
    common.forEach(item => {
      const menuLabel = getMenuLabel(category.key, item);
      if (!groupedCommon[menuLabel]) groupedCommon[menuLabel] = [];
      groupedCommon[menuLabel].push(item.value);
    });

    return (
      <View 
        key={category.key} 
        style={[
          styles.section, 
          isHighlighted && { borderColor: theme.brand, borderWidth: 2 }
        ]}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setCategoryLayouts(prev => ({ ...prev, [category.key]: y }));
        }}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name={category.icon as any} size={24} color={theme.brand} />
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>{category.label}</ThemedText>
            <ThemedText style={styles.menuLabel}>Collection: {getCollectionMenu(category.key)}</ThemedText>
          </View>
        </View>

        {Object.entries(groupedCommon).map(([menuName, items]) => (
          <View key={menuName} style={styles.matchContainer}>
            <ThemedText style={[styles.subLabel, { color: theme.brand }]}>{menuName}:</ThemedText>
            <View style={styles.itemsList}>
              {items.map((item, idx) => (
                <View key={idx} style={[styles.itemBadge, { backgroundColor: theme.brand + '20' }]}>
                  <ThemedText style={{ color: theme.brand }}>{getDisplayName(item)}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Compare Collections</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.summaryBox}>
               <ThemedText type="defaultSemiBold">Comparing with {userName}</ThemedText>
               <ThemedText style={styles.summaryText}>See what you have in common!</ThemedText>
            </View>
            
            {categories.map(renderComparisonSection)}
            
            {Object.values(myFavorites).flat().length === 0 && Object.values(theirFavorites).flat().length === 0 && (
              <View style={styles.centered}>
                <ThemedText>No favorites found to compare.</ThemedText>
              </View>
            )}
          </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  summaryBox: {
    marginBottom: Spacing.six,
    alignItems: 'center',
  },
  summaryText: {
    opacity: 0.7,
    marginTop: Spacing.one,
  },
  section: {
    marginBottom: Spacing.six,
    padding: Spacing.four,
    borderRadius: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  matchContainer: {
    marginBottom: Spacing.four,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 150, 255, 0.05)',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
    opacity: 0.8,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  itemBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  column: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    marginBottom: Spacing.one,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.4,
    fontStyle: 'italic',
  },
});
