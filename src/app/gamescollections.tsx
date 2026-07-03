import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type GameCollectionType = 'genres' | 'games' | 'main';

interface GenreCategory {
  name: string;
  subgenres: string[];
}

const GAME_GENRES: GenreCategory[] = [
  {
    name: 'Action',
    subgenres: [
      'First-Person Shooter (FPS)', 'Third-Person Shooter (TPS)', 'Fighting', 
      'Beat \'em up (Brawler)', 'Platformer', 'Battle Royale'
    ]
  },
  {
    name: 'Action-Adventure',
    subgenres: ['Survival Horror', 'Metroidvania', 'Stealth']
  },
  {
    name: 'Role-Playing (RPG)',
    subgenres: ['Action RPG (ARPG)', 'MMORPG', 'JRPG', 'Tactical RPG', 'Sandbox RPG']
  },
  {
    name: 'Strategy',
    subgenres: ['Real-Time Strategy (RTS)', 'Turn-Based Strategy (TBS)', 'MOBA', 'Grand Strategy', 'Tower Defense']
  },
  {
    name: 'Simulation',
    subgenres: ['Life Simulation', 'Vehicle Simulation', 'Management / Tycoon', 'Farming Simulation']
  },
  {
    name: 'Sports and Racing',
    subgenres: ['Sports Simulators', 'Arcade Sports', 'Racing Simulator (SimRacing)', 'Arcade Racing']
  },
  {
    name: 'Adventure and Casual',
    subgenres: ['Point-and-Click', 'Visual Novel', 'Puzzle', 'Casual']
  }
];

export default function GameCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { view, userId: paramUserId } = useLocalSearchParams<{ view: GameCollectionType; userId?: string }>();
  const [currentView, setCurrentView] = useState<GameCollectionType>('main');
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ratingMode, setRatingMode] = useState<'general' | 'aspects'>('general');
  const [generalRating, setGeneralRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState({
    gameplay: 0,
    graphics: 0,
    story: 0,
    audio: 0,
    performance: 0,
  });

  useEffect(() => {
    if (view) {
      setCurrentView(view);
    }
  }, [view]);

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

          await Promise.all([
            fetchSelectedGenres(targetUserId),
            fetchFavoriteGames(targetUserId)
          ]);
        }
      } catch (error: any) {
        console.error('Error setting up collections:', error.message);
      } finally {
        setLoading(false);
      }
    }
    setupCollections();
  }, [paramUserId]);

  const fetchSelectedGenres = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('games_favorites')
        .select('value')
        .eq('user_id', uid)
        .eq('type', 'genre');
      
      if (error) throw error;
      if (data) {
        setSelectedGenres(data.map((item: any) => item.value));
      }
    } catch (error: any) {
      console.error('Error fetching game genres:', error);
    }
  };

  const fetchFavoriteGames = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('games_favorites')
        .select('*')
        .eq('user_id', uid)
        .eq('type', 'game')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavoriteGames(data || []);
    } catch (error: any) {
      console.error('Error fetching favorite games:', error);
    }
  };

  const toggleGenre = async (genre: string, categoryName: string) => {
    if (!isOwnProfile || !userId) return;

    const isSelected = selectedGenres.includes(genre);
    try {
      if (isSelected) {
        const { error } = await supabase
          .from('games_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'genre')
          .eq('value', genre);
        if (error) throw error;
        setSelectedGenres(prev => prev.filter(g => g !== genre));
      } else {
        const { error } = await supabase
          .from('games_favorites')
          .insert({
            user_id: userId,
            type: 'genre',
            category: categoryName,
            value: genre
          });
        if (error) throw error;
        setSelectedGenres(prev => [...prev, genre]);
      }
    } catch (error: any) {
      console.error('Error toggling genre:', error.message);
      Alert.alert('Error', 'Failed to update genre preference');
    }
  };

  const updateRating = async () => {
    if (!selectedItem || !userId) return;
    
    setIsUpdating(true);
    try {
      const ratingData = ratingMode === 'general' 
        ? { mode: 'general', value: generalRating }
        : { mode: 'aspects', ...aspectRatings };

      const newMetadata = {
        ...selectedItem.metadata,
        rating: ratingData
      };

      const { error } = await supabase
        .from('games_favorites')
        .update({ 
          metadata: newMetadata,
          rating_mode: ratingMode,
          rating_general: ratingMode === 'general' ? generalRating : 0
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      setFavoriteGames(prev => prev.map(item => item.id === selectedItem.id ? { ...item, metadata: newMetadata, rating_mode: ratingMode, rating_general: ratingMode === 'general' ? generalRating : 0 } : item));
      Alert.alert('Success', 'Rating updated successfully');
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating rating:', error);
      Alert.alert('Error', 'Failed to update rating');
    } finally {
      setIsUpdating(false);
    }
  };

  const removeGame = async (id: string) => {
    if (!isOwnProfile) return;
    
    Alert.alert(
      'Remove Game',
      'Are you sure you want to remove this game from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('games_favorites')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              
              setFavoriteGames(prev => prev.filter(g => g.id !== id));
              setSelectedItem(null);
            } catch (error) {
              console.error('Error removing game:', error);
              Alert.alert('Error', 'Failed to remove game');
            }
          }
        }
      ]
    );
  };

  const openEditRating = (item: any) => {
    setSelectedItem(item);
    const rating = item.metadata?.rating;
    if (rating) {
      setRatingMode(rating.mode || 'general');
      if (rating.mode === 'aspects') {
        setAspectRatings({
          gameplay: rating.gameplay || 0,
          graphics: rating.graphics || 0,
          story: rating.story || 0,
          audio: rating.audio || 0,
          performance: rating.performance || 0,
        });
        setGeneralRating(0);
      } else {
        setGeneralRating(rating.value || 0);
        setAspectRatings({ gameplay: 0, graphics: 0, story: 0, audio: 0, performance: 0 });
      }
    } else {
      // Fallback to legacy columns if metadata.rating doesn't exist
      setRatingMode(item.rating_mode || 'general');
      if (item.rating_mode === 'aspects') {
        // In case aspects were somehow saved but not in metadata.rating (though unlikely for games)
        setAspectRatings({
          gameplay: item.metadata?.gameplay || 0,
          graphics: item.metadata?.graphics || 0,
          story: item.metadata?.story || 0,
          audio: item.metadata?.audio || 0,
          performance: item.metadata?.performance || 0,
        });
        setGeneralRating(0);
      } else {
        setGeneralRating(item.rating_general || 0);
        setAspectRatings({ gameplay: 0, graphics: 0, story: 0, audio: 0, performance: 0 });
      }
    }
  };

  const renderRatingModal = () => (
    <Modal
      visible={!!selectedItem}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSelectedItem(null)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ padding: Spacing.four }}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Image 
                  source={{ uri: selectedItem?.metadata?.image || 'https://via.placeholder.com/150' }} 
                  style={styles.modalImage}
                />
                <View style={styles.modalTitleContainer}>
                  <ThemedText type="subtitle" numberOfLines={2}>{selectedItem?.value}</ThemedText>
                  {selectedItem?.category && (
                    <ThemedText style={styles.modalCategory}>{selectedItem.category}</ThemedText>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close-circle" size={32} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSection}>
              <ThemedText type="defaultSemiBold" style={{ color: theme.brand, marginBottom: Spacing.two }}>
                {isOwnProfile ? 'Edit Rating' : 'Rating Details'}
              </ThemedText>
              
              {!isOwnProfile && ratingMode === 'aspects' && (
                <View style={{ marginBottom: Spacing.two }}>
                  <ThemedText style={{ opacity: 0.7, fontSize: 14 }}>Rated by aspects</ThemedText>
                </View>
              )}
              
              {isOwnProfile && (
                <View style={styles.ratingModeButtons}>
                  <TouchableOpacity 
                    style={[styles.modeButton, ratingMode === 'general' && { backgroundColor: theme.brand }]}
                    onPress={() => setRatingMode('general')}
                  >
                    <ThemedText style={[styles.modeButtonText, ratingMode === 'general' && { color: '#fff' }]}>General</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modeButton, ratingMode === 'aspects' && { backgroundColor: theme.brand }]}
                    onPress={() => setRatingMode('aspects')}
                  >
                    <ThemedText style={[styles.modeButtonText, ratingMode === 'aspects' && { color: '#fff' }]}>By Aspects</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {ratingMode === 'general' && (
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity 
                      key={star} 
                      onPress={() => isOwnProfile && setGeneralRating(star)}
                      disabled={!isOwnProfile}
                    >
                      <Ionicons 
                        name={star <= generalRating ? "star" : "star-outline"} 
                        size={32} 
                        color={star <= generalRating ? "#FFD700" : theme.text} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {ratingMode === 'aspects' && (
                <View style={styles.aspectsContainer}>
                  {[
                    { key: 'gameplay', label: 'Gameplay' },
                    { key: 'graphics', label: 'Graphics' },
                    { key: 'story', label: 'Story' },
                    { key: 'audio', label: 'Audio' },
                    { key: 'performance', label: 'Performance' }
                  ].map((aspect) => {
                    const ratingValue = (aspectRatings as any)[aspect.key];
                    if (!isOwnProfile && ratingValue === 0) return null;

                    return (
                      <View key={aspect.key} style={styles.aspectItem}>
                        <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                        <View style={styles.smallStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity 
                              key={star} 
                              onPress={() => isOwnProfile && setAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                              disabled={!isOwnProfile}
                            >
                              <Ionicons 
                                name={star <= ratingValue ? "star" : "star-outline"} 
                                size={24} 
                                color={star <= ratingValue ? "#FFD700" : theme.text} 
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {isOwnProfile && (
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.brand }]} 
                onPress={updateRating}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveButtonText}>Save Rating</ThemedText>}
              </TouchableOpacity>
            )}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );

  const renderMainView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.menuContainer}>
        {/* Favorite Genres Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('genres')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="list" size={24} color={theme.brand} />
              <ThemedText style={styles.previewSectionTitle}>Favorite Genres</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.genrePreviewGrid}>
            {selectedGenres.slice(0, 3).map((genre, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.chip, { backgroundColor: theme.backgroundElement, marginBottom: 0 }]}
                onPress={() => setCurrentView('genres')}
              >
                <ThemedText style={styles.chipText}>{genre}</ThemedText>
              </TouchableOpacity>
            ))}
            {selectedGenres.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('genres')} style={styles.seeAllInline}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All</ThemedText>
              </TouchableOpacity>
            )}
            {selectedGenres.length === 0 && (
              <ThemedText style={styles.emptyPreviewText}>No genres selected yet.</ThemedText>
            )}
          </View>
        </View>

        {/* Favorite Games Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('games')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="game-controller" size={24} color="#4CD964" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Games</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteGames.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.previewItem, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('games')}
              >
                <Image 
                  source={{ uri: item.metadata?.image || 'https://via.placeholder.com/150' }} 
                  style={styles.previewItemImage}
                />
                  <View style={styles.previewItemInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                    <View style={styles.itemRating}>
                      {item.metadata?.rating?.mode === 'aspects' ? (
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Ionicons 
                              key={s} 
                              name={s <= (Object.values(item.metadata.rating).filter(v => typeof v === 'number').reduce((a:any, b:any) => a + b, 0) / 5) ? "star" : "star-outline"} 
                              size={12} 
                              color="#FFD700" 
                            />
                          ))}
                          <ThemedText style={styles.ratingText}> (Aspects)</ThemedText>
                        </View>
                      ) : (
                        <>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <ThemedText style={styles.ratingText}>
                            {item.metadata?.rating?.value ? `${item.metadata.rating.value}/5` : (item.rating_general ? `${item.rating_general}/5` : 'No rating')}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  </View>
              </TouchableOpacity>
            ))}
          </View>
          {favoriteGames.length > 3 && (
            <TouchableOpacity onPress={() => setCurrentView('games')} style={styles.seeAllFooter}>
              <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteGames.length} items</ThemedText>
            </TouchableOpacity>
          )}
          {favoriteGames.length === 0 && (
            <View style={styles.emptyPreview}>
              <ThemedText style={styles.emptyPreviewText}>No favorite games yet.</ThemedText>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderGenresView = () => {
    const genresToDisplay = isOwnProfile 
      ? GAME_GENRES 
      : GAME_GENRES.map(cat => ({
          ...cat,
          subgenres: cat.subgenres.filter(genre => selectedGenres.includes(genre))
        })).filter(cat => cat.subgenres.length > 0);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {genresToDisplay.map((cat) => (
          <View key={cat.name} style={styles.genreCategory}>
            <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.name}</ThemedText>
            <View style={styles.subgenreGrid}>
              {cat.subgenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.subgenreChip,
                      { backgroundColor: isSelected ? theme.brand : theme.backgroundElement }
                    ]}
                    onPress={() => toggleGenre(genre, cat.name)}
                    disabled={!isOwnProfile}
                  >
                    <ThemedText style={[styles.subgenreText, isSelected && { color: '#fff' }]}>{genre}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {!isOwnProfile && genresToDisplay.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText}>No favorite genres selected.</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderGamesView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.itemsGrid}>
        {favoriteGames.length > 0 ? (
          favoriteGames.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.itemCard, { backgroundColor: theme.backgroundElement }]}
              onPress={() => openEditRating(item)}
            >
              {isOwnProfile && (
                <TouchableOpacity 
                  style={styles.itemRemoveButton} 
                  onPress={(e) => {
                    e.stopPropagation();
                    removeGame(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              )}
              <Image 
                source={{ uri: item.metadata?.image || 'https://via.placeholder.com/150' }} 
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                <View style={styles.itemRating}>
                  {item.metadata?.rating?.mode === 'aspects' ? (
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map(s => {
                        const avg = (Object.values(item.metadata.rating).filter(v => typeof v === 'number').reduce((a:any, b:any) => a + b, 0) / 5);
                        return (
                          <Ionicons 
                            key={s} 
                            name={s <= avg ? "star" : "star-outline"} 
                            size={12} 
                            color="#FFD700" 
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <ThemedText style={styles.ratingText}>
                        {item.metadata?.rating?.value ? `${item.metadata.rating.value}/5` : (item.rating_general ? `${item.rating_general}/5` : 'No rating')}
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText}>No favorite games yet.</ThemedText>
            {isOwnProfile && (
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: theme.brand }]}
                onPress={() => router.push('/search')}
              >
                <ThemedText style={styles.searchButtonText}>Search Games</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => currentView === 'main' ? router.back() : setCurrentView('main')}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {currentView === 'main' ? 'Game Collections' : currentView === 'genres' ? 'Favorite Genres' : 'Favorite Games'}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.brand} /></View>
        ) : (
          <View style={{ flex: 1 }}>
            {currentView === 'main' && renderMainView()}
            {(currentView === 'genres' || currentView === 'games') && (
              <View style={{ flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four }}>
                {currentView === 'genres' && renderGenresView()}
                {currentView === 'games' && renderGamesView()}
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
      {renderRatingModal()}
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
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  menuContainer: {
    gap: Spacing.four,
  },
  previewSection: {
    marginBottom: Spacing.two,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  genrePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  seeAllInline: {
    marginLeft: Spacing.two,
  },
  seeAllFooter: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    marginTop: Spacing.two,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemPreviewList: {
    gap: 0,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    padding: Spacing.two,
    gap: Spacing.three,
  },
  previewItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyPreview: {
    paddingVertical: Spacing.two,
  },
  emptyPreviewText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  menuCard: {
    width: '47%',
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  menuLabel: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  menuCount: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  genreCategory: {
    marginBottom: Spacing.six,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
    color: '#8E8E93',
  },
  subgenreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subgenreChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  subgenreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    position: 'relative',
    minHeight: 180,
  },
  itemRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  itemInfo: {
    padding: Spacing.two,
  },
  itemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    width: '100%',
  },
  emptyText: {
    marginTop: Spacing.four,
    opacity: 0.6,
  },
  searchButton: {
    marginTop: Spacing.four,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.three,
  },
  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalCategory: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  ratingSection: {
    marginBottom: Spacing.four,
  },
  ratingModeButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  modeButtonText: {
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  aspectsContainer: {
    gap: Spacing.three,
  },
  aspectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aspectLabel: {
    flex: 1,
    fontSize: 14,
  },
  smallStars: {
    flexDirection: 'row',
    gap: 4,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.six,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  removeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
