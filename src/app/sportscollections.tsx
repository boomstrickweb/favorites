import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type SportsCollectionView = 'main' | 'sports' | 'teams' | 'players' | 'leagues';

const SPORTS_CATEGORIES = [
  {
    name: 'Team Sports',
    items: [
      'Association Football', 'Futsal', 'Beach Soccer', 'Indoor Soccer', 'Five-a-side Football', 
      'American Football', 'Canadian Football', 'Flag Football', 'Touch Football', 'Rugby Union', 
      'Rugby League', 'Rugby Sevens', 'Touch Rugby', 'Tag Rugby', 'Basketball', '3x3 Basketball', 
      'Wheelchair Basketball', 'Netball', 'Korfball', 'Slamball', 'Team Handball', 'Beach Handball', 
      'Field Handball', 'Czech Handball', 'Indoor Volleyball', 'Beach Volleyball', 'Footvolley', 
      'Snow Volleyball', 'Field Hockey', 'Ice Hockey', 'Inline Hockey', 'Roller Hockey', 'Bandy', 
      'Floorball', 'Lacrosse', 'Hurling', 'Shinty', 'Water Polo', 'Canoe Polo', 'Horseball', 
      'Pato', 'Bicycle Polo', 'Segway Polo'
    ]
  },
  {
    name: 'Motorsports',
    items: [
      'Formula 1', 'IndyCar', 'Formula E', 'Formula 2', 'Formula 3', 'NASCAR', 'Supercars Championship', 
      'DTM', 'WTCR', 'WEC Le Mans', 'IMSA', 'GT World Challenge', 'WRC World Rally Championship', 
      'Rallycross', 'Dakar Rally', 'Trophy Trucks', 'MotoGP', 'Moto2', 'Moto3', 'Superbike WorldSBK', 
      'Motocross', 'Supercross', 'Speedway', 'Trials', 'Powerboat Racing', 'Hydroplane Racing', 
      'Jet Ski Racing', 'Drone Racing', 'Air Racing'
    ]
  },
  {
    name: 'Combat Sports',
    items: [
      'Professional Boxing', 'Amateur Boxing', 'Kickboxing', 'Muay Thai', 'K-1', 'Savate', 'Lethwei', 
      'Brazilian Jiu-Jitsu', 'Submission Wrestling', 'Sambo', 'Luta Livre', 'Freestyle Wrestling', 
      'Greco-Roman Wrestling', 'Sumo', 'Folkstyle Wrestling', 'Catch Wrestling', 'MMA', 'Pankration', 
      'Karate', 'Taekwondo', 'Judo', 'Wushu', 'Kung Fu', 'Aikido', 'Kendo', 'Hapkido'
    ]
  },
  {
    name: 'Racket & Paddle Sports',
    items: [
      'Tennis', 'Badminton', 'Table Tennis', 'Pickleball', 'Padel', 'Squash', 'Racquetball', 
      'Basque Pelota', 'Frontenac', 'Paddle Tennis', 'Real Tennis'
    ]
  },
  {
    name: 'Target & Precision Sports',
    items: [
      'Snooker', 'Pool', 'Carom Billiards', 'English Billiards', 'Golf', 'Disc Golf', 'Ten-pin Bowling', 
      'Nine-pin Bowling', 'Lawn Bowls', 'Bocce', 'Pétanque', 'Curling', 'Target Shooting', 'Skeet Shooting', 
      'Trapshooting', 'Recurve Archery', 'Compound Archery', 'Kyudo'
    ]
  },
  {
    name: 'Athletics & Strength Sports',
    items: [
      'Sprints', 'Middle-distance Running', 'Long-distance Running', 'Hurdles', 'Relay Races', 
      'Steeple chase', 'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 
      'Discus Throw', 'Hammer Throw', 'Javelin Throw', 'Marathon', 'Ultramarathon', 'Racewalking', 
      'Cross Country Running', 'Artistic Gymnastics', 'Rhythmic Gymnastics', 'Trampolining', 
      'Acrobatic Gymnastics', 'Weightlifting', 'Powerlifting', 'Strongman', 'Bodybuilding'
    ]
  },
  {
    name: 'Extreme & Action Sports',
    items: [
      'Skateboarding', 'Roller Skating', 'Inline Skating', 'Parkour', 'Freerunning', 'Alpine Skiing', 
      'Cross-Country Skiing', 'Ski Jumping', 'Freestyle Skiing', 'Snowboarding', 'Snowboard Cross', 
      'Surfing', 'Kitesurfing', 'Windsurfing', 'Wakeboarding', 'Wakesurfing', 'Water Skiing', 
      'Sport Climbing', 'Ice Climbing', 'Mountaineering', 'Paragliding', 'Hang Gliding', 
      'Skydiving', 'BASE Jumping', 'Wingsuit Flying'
    ]
  },
  {
    name: 'Watercraft & Nautical Sports',
    items: [
      'Rowing', 'Coastal Rowing', 'Whitewater Kayaking', 'Canoeing', 'Rafting', 'Dragon Boat Racing', 
      'Yacht Racing', 'Dinghy Sailing', 'Windsurfing Racing', "America's Cup"
    ]
  },
  {
    name: 'Bat-and-Ball Sports',
    items: [
      'Test Cricket', 'One Day International ODI', 'T20 Cricket', 'T10 Cricket', 'Indoor Cricket', 
      'Baseball', 'Softball', 'Baseball5', 'Kickball', 'Rounders', 'Lapta'
    ]
  },
  {
    name: 'Animal-Assisted Sports',
    items: [
      'Dressage', 'Show Jumping', 'Eventing', 'Horse Racing', 'Harness Racing', 'Rodeo', 'Bull Riding', 
      'Barrel Racing', 'Polo', 'Buzkashi', 'Camel Racing', 'Sled Dog Racing'
    ]
  },
  {
    name: 'Mind Sports & Esports',
    items: [
      'Chess', 'Go', 'Shogi', 'Xiangqi', 'Checkers', 'Duplicate Bridge', 'Poker', 'League of Legends', 
      'Dota 2', 'Counter-Strike', 'Valorant', 'Street Fighter', 'EA FC', 'NBA 2K'
    ]
  }
];

export default function SportscollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<SportsCollectionView>('main');
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    async function setupCollections() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = paramUserId || user?.id;
        
        if (targetUserId) {
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
          
          // Fetch all sports favorites
          const { data, error } = await supabase
            .from('sports_favorites')
            .select('*')
            .eq('user_id', targetUserId);
            
          if (error) throw error;
          
          if (data) {
            setFavorites(data);
            setFavoriteSports(data.filter(d => d.type === 'sport').map(d => d.item_id));
          }
        }
      } catch (error) {
        console.error('Error setting up sports collections:', error);
      } finally {
        setLoading(false);
      }
    }
    setupCollections();
  }, [paramUserId]);

  const toggleSport = async (sportName: string) => {
    if (!userId || !isOwnProfile) return;

    const isFav = favoriteSports.includes(sportName);
    const newFavs = isFav 
      ? favoriteSports.filter(s => s !== sportName)
      : [...favoriteSports, sportName];

    setFavoriteSports(newFavs);

    try {
      if (isFav) {
        const { error } = await supabase
          .from('sports_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', sportName)
          .eq('type', 'sport');
          
        if (error) {
          console.error('Supabase error deleting sport:', error);
          // Rollback local state
          setFavoriteSports(favoriteSports);
          Alert.alert('Error', 'Failed to remove from favorites: ' + error.message);
        } else {
          setFavorites(prev => prev.filter(f => !(f.item_id === sportName && f.type === 'sport')));
        }
      } else {
        const { data, error } = await supabase
          .from('sports_favorites')
          .insert({
            user_id: userId,
            item_id: sportName,
            type: 'sport',
            metadata: { name: sportName }
          })
          .select()
          .single();
          
        if (error) {
          console.error('Supabase error inserting sport:', error);
          // Rollback local state
          setFavoriteSports(favoriteSports);
          Alert.alert('Error', 'Failed to add to favorites: ' + error.message);
        } else if (data) {
          setFavorites(prev => [...prev, data]);
        }
      }
    } catch (error) {
      console.error('Error updating favorite sport:', error);
      setFavoriteSports(favoriteSports);
    }
  };

  const removeFavorite = async (id: string) => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('sports_favorites')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error removing favorite:', error);
        Alert.alert('Error', 'Failed to remove favorite: ' + error.message);
        return;
      }
      
      setFavorites(prev => prev.filter(f => f.id !== id));
      // Also update favoriteSports if it was a sport
      const removed = favorites.find(f => f.id === id);
      if (removed && removed.type === 'sport') {
        setFavoriteSports(prev => prev.filter(s => s !== removed.item_id));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite');
    }
  };

  const renderHeader = () => {
    let title = 'Sports Collections';
    if (currentView === 'sports') title = 'Favorite Sports';
    if (currentView === 'teams') title = 'Favorite Teams';
    if (currentView === 'players') title = 'Favorite Players';
    if (currentView === 'leagues') title = 'Favorite Leagues';

    return (
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => currentView === 'main' ? router.back() : setCurrentView('main')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>{title}</ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {isOwnProfile ? (
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push({
                pathname: '/findsoulmate',
                params: { category: 'sports_favorites' }
              })}
            >
              <Ionicons name="heart" size={24} color={theme.brand} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push({
                pathname: '/compare',
                params: { userId: userId, userName: 'User', highlightCategory: 'sports_favorites' }
              })}
            >
              <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMainView = () => {
    const categories: { name: string, icon: any, view: SportsCollectionView, color: string, viewType: string | null }[] = [
      { name: 'Favorite Sports', icon: 'trophy', view: 'sports', color: '#FF9500', viewType: 'sport' },
      { name: 'Favorite Teams', icon: 'people', view: 'teams', color: '#007AFF', viewType: 'team' },
      { name: 'Favorite Players', icon: 'person', view: 'players', color: '#FF2D55', viewType: 'player' },
      { name: 'Favorite Leagues', icon: 'list', view: 'leagues', color: '#4CD964', viewType: 'league' },
    ];

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {categories.map((cat) => {
            const items = cat.viewType === 'sport' 
              ? favoriteSports.map(s => ({ id: s, value: s, metadata: { name: s } }))
              : favorites.filter(f => f.type === cat.viewType).map(f => ({ id: f.id, value: f.item_id, metadata: f.metadata }));

            return (
              <View key={cat.view} style={styles.previewSection}>
                <TouchableOpacity 
                  style={styles.previewSectionHeader}
                  onPress={() => setCurrentView(cat.view)}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                    <ThemedText style={styles.previewSectionTitle}>{cat.name}</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                
                {cat.viewType === 'sport' ? (
                  <View style={styles.genrePreviewGrid}>
                    {items.slice(0, 3).map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.sportChip, { backgroundColor: theme.backgroundElement, marginBottom: 0 }]}
                        onPress={() => setCurrentView(cat.view)}
                      >
                        <ThemedText style={styles.sportText}>{item.value}</ThemedText>
                      </TouchableOpacity>
                    ))}
                    {items.length > 3 && (
                      <TouchableOpacity onPress={() => setCurrentView(cat.view)} style={styles.seeAllInline}>
                        <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.itemPreviewList}>
                    {items.slice(0, 3).map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                        onPress={() => setCurrentView(cat.view)}
                      >
                        {item.metadata?.image ? (
                          <Image source={{ uri: item.metadata.image }} style={[styles.favoriteImage, { width: 50, height: 50, borderRadius: 25 }]} />
                        ) : (
                          <View style={[styles.favoriteImage, styles.placeholderImage, { width: 50, height: 50, borderRadius: 25 }]}>
                            <ThemedText style={{ fontSize: 20 }}>
                              {cat.viewType === 'player' ? '👤' : cat.viewType === 'team' ? '⚽' : '🏆'}
                            </ThemedText>
                          </View>
                        )}
                        <View style={[styles.favoriteInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                          <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                          <ThemedText style={{ fontSize: 12, opacity: 0.6 }} numberOfLines={1}>
                            {item.metadata?.subtitle || item.metadata?.sport || ''}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {items.length > 3 && (
                      <TouchableOpacity onPress={() => setCurrentView(cat.view)} style={styles.seeAllFooter}>
                        <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {items.length} items</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderSportsView = () => {
    const displayedCategories = isOwnProfile 
      ? SPORTS_CATEGORIES 
      : SPORTS_CATEGORIES.map(category => ({
          ...category,
          items: category.items.filter(sport => favoriteSports.includes(sport))
        })).filter(category => category.items.length > 0);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {displayedCategories.length > 0 ? (
          displayedCategories.map((category) => (
            <View key={category.name} style={styles.categorySection}>
              <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{category.name}</ThemedText>
              <View style={styles.sportsGrid}>
                {category.items.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportChip,
                      { backgroundColor: favoriteSports.includes(sport) ? theme.brand : theme.backgroundElement }
                    ]}
                    onPress={() => isOwnProfile && toggleSport(sport)}
                    disabled={!isOwnProfile}
                  >
                    <ThemedText 
                      style={[
                        styles.sportText,
                        { color: favoriteSports.includes(sport) ? '#fff' : theme.text }
                      ]}
                    >
                      {sport}
                    </ThemedText>
                    {favoriteSports.includes(sport) && (
                      <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="trophy-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.placeholderText}>No favorite sports shared yet.</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderCollectionView = (type: string, title: string) => {
    const filteredFavs = favorites.filter(f => f.type === type);
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredFavs.length === 0 ? (
          <View style={styles.placeholderContainer}>
            <Ionicons name="star-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={styles.placeholderText}>No favorite {title.toLowerCase()} yet.</ThemedText>
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: theme.brand }]}
              onPress={() => router.push('/(tabs)/search')}
            >
              <ThemedText style={styles.searchButtonText}>Go to Search</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.favoritesGrid}>
            {filteredFavs.map((item) => (
              <View key={item.id} style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement }]}>
                {item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={styles.favoriteImage} />
                ) : (
                  <View style={[styles.favoriteImage, styles.placeholderImage]}>
                    <ThemedText style={styles.placeholderIcon}>
                      {type === 'player' ? '👤' : type === 'team' ? '⚽' : '🏆'}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.favoriteInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.item_id}</ThemedText>
                  <ThemedText style={styles.favoriteSubtitle}>{item.metadata?.subtitle || item.metadata?.sport || ''}</ThemedText>
                </View>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPlaceholderView = (viewName: string) => {
    return (
      <View style={styles.placeholderContainer}>
        <Ionicons name="construct-outline" size={64} color={theme.textSecondary} />
        <ThemedText style={styles.placeholderText}>{viewName} collection coming soon!</ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        {currentView === 'main' && renderMainView()}
        {currentView === 'sports' && renderSportsView()}
        {currentView === 'teams' && renderCollectionView('team', 'Teams')}
        {currentView === 'players' && renderCollectionView('player', 'Players')}
        {currentView === 'leagues' && renderCollectionView('league', 'Leagues')}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  menuContainer: {
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
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sportText: {
    fontSize: 14,
  },
  categorySection: {
    marginBottom: Spacing.six,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
    opacity: 0.8,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  placeholderText: {
    marginTop: Spacing.four,
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  favoritesGrid: {
    gap: Spacing.three,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.three,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 20,
  },
  favoriteSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  searchButton: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: 25,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
});
