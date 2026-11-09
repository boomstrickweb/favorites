import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type SportsCollectionView = 'main' | 'sports' | 'football' | 'basketball' | 'racing';

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

export function getSportCategory(item: any): 'Football' | 'Basketball' | 'Racing' | 'Other' {
  if (item.type === 'sport') return 'Other';
  
  const sport = (item.metadata?.sport || item.metadata?.category || item.metadata?.details?.sport || '').toString().toLowerCase();
  const subtitle = (item.metadata?.subtitle || '').toLowerCase();
  const apiId = (item.metadata?.api_sports_id || item.id || '').toString().toLowerCase();
  
  if (
    sport.includes('basket') || 
    sport.includes('nba') || 
    subtitle.includes('basketball') || 
    subtitle.includes('nba') || 
    apiId.includes('basketball') || 
    apiId.includes('nba')
  ) {
    return 'Basketball';
  }
  
  if (
    sport.includes('rac') || 
    sport.includes('f1') || 
    sport.includes('formula') || 
    sport.includes('motor') || 
    subtitle.includes('racing') || 
    subtitle.includes('f1') || 
    apiId.includes('racing')
  ) {
    return 'Racing';
  }
  
  if (
    sport.includes('socc') || 
    sport.includes('foot') || 
    item.type === 'league' || 
    subtitle.includes('soccer') || 
    subtitle.includes('football') || 
    apiId.includes('soccer') || 
    apiId.includes('football')
  ) {
    return 'Football';
  }

  // Fallback for legacy sports items which were all soccer
  return 'Football';
}

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

  // Sub-tab filters
  const [footballTab, setFootballTab] = useState<'team' | 'player' | 'league'>('team');
  const [basketballTab, setBasketballTab] = useState<'team' | 'player'>('team');
  const [racingTab, setRacingTab] = useState<'player'>('player');

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
    if (currentView === 'football') title = 'Football Collection';
    if (currentView === 'basketball') title = 'Basketball Collection';
    if (currentView === 'racing') title = 'Racing Collection';

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

  const footballItems = favorites.filter(f => f.type !== 'sport' && getSportCategory(f) === 'Football');
  const basketballItems = favorites.filter(f => f.type !== 'sport' && getSportCategory(f) === 'Basketball');
  const racingItems = favorites.filter(f => f.type !== 'sport' && getSportCategory(f) === 'Racing');

  const renderMainView = () => {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {/* Favorite Sports Section */}
          <View style={styles.previewSection}>
            <TouchableOpacity 
              style={styles.previewSectionHeader}
              onPress={() => setCurrentView('sports')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="trophy" size={24} color="#FF9500" />
                <ThemedText style={styles.previewSectionTitle}>Favorite Sports</ThemedText>
              </View>
              <View style={styles.headerRightGroup}>
                {favoriteSports.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={styles.badgeText}>{favoriteSports.length}</ThemedText>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.genrePreviewGrid}>
              {favoriteSports.slice(0, 4).map((sport, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.sportChip, { backgroundColor: theme.backgroundElement, marginBottom: 0 }]}
                  onPress={() => setCurrentView('sports')}
                >
                  <ThemedText style={styles.sportText}>{sport}</ThemedText>
                </TouchableOpacity>
              ))}
              {favoriteSports.length === 0 && (
                <ThemedText style={styles.emptyPreviewText}>No sports chosen yet</ThemedText>
              )}
              {favoriteSports.length > 4 && (
                <TouchableOpacity onPress={() => setCurrentView('sports')} style={styles.seeAllInline}>
                  <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All ({favoriteSports.length})</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Football Section */}
          <View style={styles.previewSection}>
            <TouchableOpacity 
              style={styles.previewSectionHeader}
              onPress={() => setCurrentView('football')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="football" size={24} color="#007AFF" />
                <ThemedText style={styles.previewSectionTitle}>Football</ThemedText>
              </View>
              <View style={styles.headerRightGroup}>
                <View style={styles.subCategoryPills}>
                  <ThemedText style={styles.subCategoryPillText}>
                    Teams: {footballItems.filter(i => i.type === 'team').length} • Players: {footballItems.filter(i => i.type === 'player').length} • Leagues: {footballItems.filter(i => i.type === 'league').length}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.itemPreviewList}>
              {footballItems.slice(0, 3).map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                  onPress={() => {
                    if (item.type === 'player') setFootballTab('player');
                    else if (item.type === 'league') setFootballTab('league');
                    else setFootballTab('team');
                    setCurrentView('football');
                  }}
                >
                  {item.metadata?.image ? (
                    <Image source={{ uri: item.metadata.image }} style={[styles.favoriteImage, { width: 44, height: 44, borderRadius: 22 }]} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.placeholderImage, { width: 44, height: 44, borderRadius: 22 }]}>
                      <ThemedText style={{ fontSize: 18 }}>
                        {item.type === 'player' ? '👤' : item.type === 'league' ? '🏆' : '⚽'}
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.favoriteInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.item_id}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }} numberOfLines={1}>
                      {item.type === 'player' ? 'Player' : item.type === 'league' ? 'League' : 'Team'}
                      {item.metadata?.subtitle ? ` • ${item.metadata.subtitle}` : ''}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
              {footballItems.length === 0 && (
                <ThemedText style={styles.emptyPreviewText}>No favorite football teams, players, or leagues yet</ThemedText>
              )}
              {footballItems.length > 3 && (
                <TouchableOpacity onPress={() => setCurrentView('football')} style={styles.seeAllFooter}>
                  <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {footballItems.length} items</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Basketball Section */}
          <View style={styles.previewSection}>
            <TouchableOpacity 
              style={styles.previewSectionHeader}
              onPress={() => setCurrentView('basketball')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="basketball" size={24} color="#FF6B00" />
                <ThemedText style={styles.previewSectionTitle}>Basketball</ThemedText>
              </View>
              <View style={styles.headerRightGroup}>
                <View style={styles.subCategoryPills}>
                  <ThemedText style={styles.subCategoryPillText}>
                    Teams: {basketballItems.filter(i => i.type === 'team').length} • Players: {basketballItems.filter(i => i.type === 'player').length}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.itemPreviewList}>
              {basketballItems.slice(0, 3).map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                  onPress={() => {
                    if (item.type === 'player') setBasketballTab('player');
                    else setBasketballTab('team');
                    setCurrentView('basketball');
                  }}
                >
                  {item.metadata?.image ? (
                    <Image source={{ uri: item.metadata.image }} style={[styles.favoriteImage, { width: 44, height: 44, borderRadius: 22 }]} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.placeholderImage, { width: 44, height: 44, borderRadius: 22 }]}>
                      <ThemedText style={{ fontSize: 18 }}>
                        {item.type === 'player' ? '👤' : '🏀'}
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.favoriteInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.item_id}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }} numberOfLines={1}>
                      {item.type === 'player' ? 'Player' : 'Team'}
                      {item.metadata?.subtitle ? ` • ${item.metadata.subtitle}` : ''}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
              {basketballItems.length === 0 && (
                <ThemedText style={styles.emptyPreviewText}>No favorite basketball teams or players yet</ThemedText>
              )}
              {basketballItems.length > 3 && (
                <TouchableOpacity onPress={() => setCurrentView('basketball')} style={styles.seeAllFooter}>
                  <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {basketballItems.length} items</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Racing Section */}
          <View style={styles.previewSection}>
            <TouchableOpacity 
              style={styles.previewSectionHeader}
              onPress={() => setCurrentView('racing')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="flag" size={24} color="#FF2D55" />
                <ThemedText style={styles.previewSectionTitle}>Racing</ThemedText>
              </View>
              <View style={styles.headerRightGroup}>
                <View style={styles.subCategoryPills}>
                  <ThemedText style={styles.subCategoryPillText}>
                    Drivers: {racingItems.length}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.itemPreviewList}>
              {racingItems.slice(0, 3).map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                  onPress={() => {
                    setRacingTab('player');
                    setCurrentView('racing');
                  }}
                >
                  {item.metadata?.image ? (
                    <Image source={{ uri: item.metadata.image }} style={[styles.favoriteImage, { width: 44, height: 44, borderRadius: 22 }]} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.placeholderImage, { width: 44, height: 44, borderRadius: 22 }]}>
                      <ThemedText style={{ fontSize: 18 }}>🏎️</ThemedText>
                    </View>
                  )}
                  <View style={[styles.favoriteInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.item_id}</ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }} numberOfLines={1}>
                      Driver{item.metadata?.subtitle ? ` • ${item.metadata.subtitle}` : ''}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
              {racingItems.length === 0 && (
                <ThemedText style={styles.emptyPreviewText}>No favorite racing drivers yet</ThemedText>
              )}
              {racingItems.length > 3 && (
                <TouchableOpacity onPress={() => setCurrentView('racing')} style={styles.seeAllFooter}>
                  <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {racingItems.length} items</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
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

  const renderSportCategoryView = (sportCategory: 'Football' | 'Basketball' | 'Racing') => {
    let tabs: { id: string; label: string; count: number }[] = [];
    let activeTab = 'team';
    let setActiveTab: (tab: any) => void = () => {};
    let searchFilter = 'Football';

    if (sportCategory === 'Football') {
      searchFilter = 'Football';
      activeTab = footballTab;
      setActiveTab = setFootballTab;
      tabs = [
        { id: 'team', label: 'Teams', count: footballItems.filter(i => i.type === 'team').length },
        { id: 'player', label: 'Players', count: footballItems.filter(i => i.type === 'player').length },
        { id: 'league', label: 'Leagues', count: footballItems.filter(i => i.type === 'league').length },
      ];
    } else if (sportCategory === 'Basketball') {
      searchFilter = 'Basketball';
      activeTab = basketballTab;
      setActiveTab = setBasketballTab;
      tabs = [
        { id: 'team', label: 'Teams', count: basketballItems.filter(i => i.type === 'team').length },
        { id: 'player', label: 'Players', count: basketballItems.filter(i => i.type === 'player').length },
      ];
    } else if (sportCategory === 'Racing') {
      searchFilter = 'Racing';
      activeTab = racingTab;
      setActiveTab = setRacingTab;
      tabs = [
        { id: 'player', label: 'Drivers', count: racingItems.filter(i => i.type === 'player' || i.type === 'driver').length },
      ];
    }

    const currentItems = (sportCategory === 'Football' ? footballItems : sportCategory === 'Basketball' ? basketballItems : racingItems)
      .filter(item => {
        if (sportCategory === 'Racing') {
          return item.type === 'player' || item.type === 'driver';
        }
        return item.type === activeTab;
      });

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Items';

    return (
      <View style={{ flex: 1 }}>
        {/* Sub-tabs selector */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabButton,
                  isSelected && { borderBottomColor: theme.brand, borderBottomWidth: 2 }
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabButtonText,
                    isSelected ? { color: theme.brand, fontWeight: '700' } : { color: theme.textSecondary }
                  ]}
                >
                  {tab.label} ({tab.count})
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentItems.length === 0 ? (
            <View style={styles.placeholderContainer}>
              <Ionicons 
                name={sportCategory === 'Football' ? (activeTab === 'team' ? 'shield-outline' : activeTab === 'league' ? 'trophy-outline' : 'person-outline') : sportCategory === 'Basketball' ? (activeTab === 'team' ? 'basketball-outline' : 'person-outline') : 'flag-outline'} 
                size={64} 
                color={theme.textSecondary} 
              />
              <ThemedText style={styles.placeholderText}>
                No favorite {sportCategory} {activeTabLabel.toLowerCase()} yet.
              </ThemedText>
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: theme.brand }]}
                onPress={() => router.push('/(tabs)/search')}
              >
                <ThemedText style={styles.searchButtonText}>Search {sportCategory}</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.favoritesGrid}>
              {currentItems.map((item) => (
                <View key={item.id} style={[styles.favoriteCard, { backgroundColor: theme.backgroundElement }]}>
                  {item.metadata?.image ? (
                    <Image source={{ uri: item.metadata.image }} style={styles.favoriteImage} />
                  ) : (
                    <View style={[styles.favoriteImage, styles.placeholderImage]}>
                      <ThemedText style={styles.placeholderIcon}>
                        {sportCategory === 'Racing' ? '🏎️' : item.type === 'player' ? '👤' : item.type === 'league' ? '🏆' : (sportCategory === 'Basketball' ? '🏀' : '⚽')}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.favoriteInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.item_id}</ThemedText>
                    <ThemedText style={styles.favoriteSubtitle}>
                      {item.metadata?.subtitle || item.metadata?.sport || ''}
                    </ThemedText>
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
        {currentView === 'football' && renderSportCategoryView('Football')}
        {currentView === 'basketball' && renderSportCategoryView('Basketball')}
        {currentView === 'racing' && renderSportCategoryView('Racing')}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    paddingHorizontal: Spacing.four,
  },
  tabButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginRight: Spacing.two,
  },
  tabButtonText: {
    fontSize: 14,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  subCategoryPills: {
    maxWidth: 200,
  },
  subCategoryPillText: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'right',
  },
  emptyPreviewText: {
    fontSize: 13,
    opacity: 0.5,
    fontStyle: 'italic',
    paddingVertical: Spacing.one,
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
    paddingVertical: 60,
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
