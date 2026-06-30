import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type FoodCollectionView = 'main' | 'cuisines' | 'dishes' | 'drinks' | 'desserts';

const CUISINES = [
  'European', 'African', 'Asian', 'Turkish & Central Asia', 'Americas', 'Oceanian'
];

export default function FoodCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [currentView, setCurrentView] = useState<FoodCollectionView>('main');
  const [loading, setLoading] = useState(true);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<{id: string, value: string, image?: string}[]>([]);
  const [favoriteDrinks, setFavoriteDrinks] = useState<{id: string, value: string, image?: string}[]>([]);
  const [favoriteDesserts, setFavoriteDesserts] = useState<{id: string, value: string, image?: string}[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [paramUserId]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = paramUserId || user?.id;
      if (!targetUserId) return;
      
      setUserId(targetUserId);
      const isOwn = user?.id === targetUserId;
      setIsOwnProfile(isOwn);

      // Privacy Check
      if (!isOwn) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('privacy_collections')
          .eq('id', targetUserId)
          .single();
        
        if (profileError) throw profileError;

        const privacy = profileData?.privacy_collections || 'Everyone';
        if (privacy !== 'Everyone') {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user?.id)
            .eq('following_id', targetUserId)
            .maybeSingle();
          
          const isFollowing = !!followData;

          const { data: followerData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', targetUserId)
            .eq('following_id', user?.id)
            .maybeSingle();
          
          const followsBack = !!followerData;

          if (
            (privacy === 'Your Followers' && !isFollowing) ||
            (privacy === 'Followers you follow back' && (!isFollowing || !followsBack))
          ) {
            Alert.alert('Privacy', 'This user has restricted who can see their collections.');
            router.back();
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from('food_favorites')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) {
        // If table doesn't exist, we'll handle it gracefully
        if (error.code === 'PGRST116' || error.message.includes('relation "food_favorites" does not exist')) {
          console.warn('food_favorites table might not exist yet');
          return;
        }
        throw error;
      }

      if (data) {
        const cuisines = data.filter(item => item.type === 'cuisine').map(item => item.value);
        const dishes = data.filter(item => item.type === 'dish').map(item => ({ 
          id: item.id, 
          value: item.value,
          image: item.metadata?.image
        }));
        const drinks = data.filter(item => item.type === 'drink').map(item => ({ 
          id: item.id, 
          value: item.value,
          image: item.metadata?.image
        }));
        const desserts = data.filter(item => item.type === 'dessert').map(item => ({ 
          id: item.id, 
          value: item.value,
          image: item.metadata?.image
        }));
        setSelectedCuisines(cuisines);
        setFavoriteDishes(dishes);
        setFavoriteDrinks(drinks);
        setFavoriteDesserts(desserts);
      }
    } catch (error: any) {
      console.error('Error fetching food collections:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCuisine = async (cuisine: string) => {
    if (!userId || !isOwnProfile) return;

    const isSelected = selectedCuisines.includes(cuisine);
    
    try {
      if (isSelected) {
        const { error } = await supabase
          .from('food_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'cuisine')
          .eq('value', cuisine);
        
        if (error) throw error;
        setSelectedCuisines(prev => prev.filter(c => c !== cuisine));
      } else {
        const { error } = await supabase
          .from('food_favorites')
          .insert({
            user_id: userId,
            type: 'cuisine',
            value: cuisine
          });
        
        if (error) throw error;
        setSelectedCuisines(prev => [...prev, cuisine]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Could not update cuisines. Make sure the database table exists.');
      console.error('Error updating cuisine:', error.message);
    }
  };


  const removeDish = async (id: string) => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('food_favorites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setFavoriteDishes(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      Alert.alert('Error', 'Could not remove dish.');
      console.error('Error removing dish:', error.message);
    }
  };

  const removeDrink = async (id: string) => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('food_favorites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setFavoriteDrinks(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      Alert.alert('Error', 'Could not remove drink.');
      console.error('Error removing drink:', error.message);
    }
  };

  const removeDessert = async (id: string) => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('food_favorites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setFavoriteDesserts(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      Alert.alert('Error', 'Could not remove dessert.');
      console.error('Error removing dessert:', error.message);
    }
  };

  const renderMainView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.menuContainer}>
        {/* Favorite Cuisines Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('cuisines')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="restaurant" size={24} color="#FF2D55" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Cuisines</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.genrePreviewGrid}>
            {selectedCuisines.slice(0, 3).map((cuisine, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.cuisineItem, { backgroundColor: theme.backgroundElement, marginBottom: 0, paddingVertical: 6 }]}
                onPress={() => setCurrentView('cuisines')}
              >
                <ThemedText style={styles.cuisineText}>{cuisine}</ThemedText>
              </TouchableOpacity>
            ))}
            {selectedCuisines.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('cuisines')} style={styles.seeAllInline}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Dishes Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('dishes')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="pizza" size={24} color="#FF9500" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Dishes</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteDishes.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.itemCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('dishes')}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Ionicons name="pizza" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteDishes.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('dishes')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteDishes.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Drinks Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('drinks')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="wine" size={24} color="#5856D6" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Drinks</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteDrinks.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.itemCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('drinks')}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Ionicons name="wine" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteDrinks.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('drinks')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteDrinks.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Desserts Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('desserts')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="ice-cream" size={24} color="#AF52DE" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Desserts</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteDesserts.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.itemCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('desserts')}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Ionicons name="ice-cream" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteDesserts.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('desserts')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteDesserts.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCuisinesView = () => {
    const displayedCuisines = isOwnProfile 
      ? CUISINES 
      : CUISINES.filter(c => selectedCuisines.includes(c));

    return (
      <View>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentView('main')}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
          <ThemedText style={styles.backButtonText}>Back to Food</ThemedText>
        </TouchableOpacity>
        
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Favorite Cuisines</ThemedText>
        <View style={styles.cuisinesGrid}>
          {displayedCuisines.map(cuisine => {
            const isSelected = selectedCuisines.includes(cuisine);
            return (
              <TouchableOpacity 
                key={cuisine}
                style={[
                  styles.cuisineItem, 
                  { backgroundColor: isSelected ? theme.brand : theme.backgroundSelected }
                ]}
                onPress={() => isOwnProfile && toggleCuisine(cuisine)}
                disabled={!isOwnProfile}
              >
                <ThemedText style={[
                  styles.cuisineText,
                  { color: isSelected ? '#FFFFFF' : theme.text }
                ]}>
                  {cuisine}
                </ThemedText>
                {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            );
          })}
          {displayedCuisines.length === 0 && !isOwnProfile && (
            <ThemedText style={styles.emptyText}>No favorite cuisines shared yet.</ThemedText>
          )}
        </View>
      </View>
    );
  };

  const renderDishesView = () => (
    <View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setCurrentView('main')}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
        <ThemedText style={styles.backButtonText}>Back to Food</ThemedText>
      </TouchableOpacity>
      
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Favorite Dishes</ThemedText>
      
      <View style={styles.dishesList}>
        {favoriteDishes.map(dish => (
          <View key={dish.id} style={[styles.dishItem, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.dishInfo}>
              {dish.image && (
                <Image source={{ uri: dish.image }} style={styles.dishImage} />
              )}
              <ThemedText style={styles.dishText}>{dish.value}</ThemedText>
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => removeDish(dish.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.brand} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {favoriteDishes.length === 0 && (
          <ThemedText style={styles.emptyText}>No dishes added yet.</ThemedText>
        )}
      </View>
    </View>
  );

  const renderDrinksView = () => (
    <View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setCurrentView('main')}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
        <ThemedText style={styles.backButtonText}>Back to Food</ThemedText>
      </TouchableOpacity>
      
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Favorite Drinks</ThemedText>
      
      <View style={styles.dishesList}>
        {favoriteDrinks.map(drink => (
          <View key={drink.id} style={[styles.dishItem, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.dishInfo}>
              {drink.image && (
                <Image source={{ uri: drink.image }} style={styles.dishImage} />
              )}
              <ThemedText style={styles.dishText}>{drink.value}</ThemedText>
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => removeDrink(drink.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.brand} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {favoriteDrinks.length === 0 && (
          <ThemedText style={styles.emptyText}>No drinks added yet.</ThemedText>
        )}
      </View>
    </View>
  );

  const renderDessertsView = () => (
    <View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setCurrentView('main')}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
        <ThemedText style={styles.backButtonText}>Back to Food</ThemedText>
      </TouchableOpacity>
      
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Favorite Desserts</ThemedText>
      
      <View style={styles.dishesList}>
        {favoriteDesserts.map(dessert => (
          <View key={dessert.id} style={[styles.dishItem, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.dishInfo}>
              {dessert.image && (
                <Image source={{ uri: dessert.image }} style={styles.dishImage} />
              )}
              <ThemedText style={styles.dishText}>{dessert.value}</ThemedText>
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => removeDessert(dessert.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.brand} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {favoriteDesserts.length === 0 && (
          <ThemedText style={styles.emptyText}>No desserts added yet.</ThemedText>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: currentView === 'main' ? 'Food Collections' : 
                 currentView === 'cuisines' ? 'Favorite Cuisines' : 
                 currentView === 'dishes' ? 'Favorite Dishes' :
                 currentView === 'drinks' ? 'Favorite Drinks' : 'Favorite Desserts',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginRight: Spacing.two }}>
              {isOwnProfile ? (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/findsoulmate',
                    params: { category: 'food_favorites' }
                  })}
                >
                  <Ionicons name="heart" size={24} color={theme.brand} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/compare',
                    params: { userId: userId, userName: 'User', highlightCategory: 'food_favorites' }
                  })}
                >
                  <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }} 
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 50 }} />
          ) : (
            <>
              {currentView === 'main' && renderMainView()}
              {currentView === 'cuisines' && renderCuisinesView()}
              {currentView === 'dishes' && renderDishesView()}
              {currentView === 'drinks' && renderDrinksView()}
              {currentView === 'desserts' && renderDessertsView()}
            </>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: Spacing.four,
  },
  menuContainer: {
    gap: Spacing.four,
  },
  grid: {
    gap: Spacing.four,
  },
  previewSection: {
    marginBottom: Spacing.four,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  genrePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  seeAllInline: {
    marginLeft: Spacing.two,
  },
  itemPreviewList: {
    gap: 0,
  },
  seeAllFooter: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    marginTop: Spacing.two,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderImage: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: Spacing.four,
  },
  cuisinesGrid: {
    gap: Spacing.two,
  },
  cuisineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: 12,
  },
  cuisineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishesList: {
    gap: Spacing.two,
  },
  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 12,
  },
  dishInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  dishImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  dishText: {
    fontSize: 16,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: Spacing.four,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
});
