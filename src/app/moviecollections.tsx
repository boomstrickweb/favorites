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

type MovieCollectionType = 'genres' | 'actors' | 'movies' | 'series' | 'main';

interface GenreCategory {
  name: string;
  subgenres: string[];
}

const MOVIE_GENRES: GenreCategory[] = [
  {
    name: 'Action & Adventure',
    subgenres: [
      'Action: Martial Arts (Kung Fu/Wuxia)', 'Action Thriller', 'Superhero', 'Military/War Action', 
      'Spy/Espionage', 'Gun Fu', 'Cyberpunk Action', 'Tokusatsu (Kaiju/Giant Monster)', 'Crime Action',
      'Adventure: Swashbuckler (Pirate)', 'Treasure Hunt/Quest', 'Survival Adventure', 
      'Wilderness/Exploration', 'Space Adventure', 'Epic Journey'
    ]
  },
  {
    name: 'Sci-Fi & Fantasy',
    subgenres: [
      'Science Fiction (Sci-Fi): Cyberpunk', 'Steampunk', 'Space Opera', 'Hard Sci-Fi', 'Soft Sci-Fi', 
      'Post-Apocalyptic', 'Dystopian', 'Time Travel', 'Alien Invasion', 'Mecha', 'Biopunk',
      'Fantasy: High Fantasy / Epic Fantasy', 'Dark Fantasy', 'Urban Fantasy', 'Contemporary Fantasy', 
      'Sword & Sorcery', 'Magical Realism', 'Mythic Fantasy', 'Fairy Tale Retelling'
    ]
  },
  {
    name: 'Horror & Thriller',
    subgenres: [
      'Horror: Slasher', 'Psychological Horror', 'Supernatural Horror', 'Cosmic Horror (Lovecraftian)', 
      'Found Footage', 'Body Horror', 'Monster Movie (Vampire/Werewolf/Zombie)', 'Folk Horror', 
      'Splatter/Gore', 'Comedy Horror',
      'Thriller: Psychological Thriller', 'Crime Thriller', 'Political Thriller', 'Techno-Thriller', 
      'Legal Thriller', 'Erotic Thriller', 'Mystery Thriller', 'Conspiracy Thriller'
    ]
  },
  {
    name: 'Drama & Romance',
    subgenres: [
      'Drama: Melodrama', 'Period Piece / Costume Drama', 'Medical Drama', 'Legal Drama', 'Family Drama', 
      'Teen Drama', 'Coming-of-Age (Bildungsroman)', 'Political Drama', 'Sports Drama', 'Social Realism',
      'Romance: Romantic Comedy (Rom-Com)', 'Romantic Drama', 'Historical Romance', 'Paranormal Romance', 
      'Workplace Romance', 'Forbidden Love'
    ]
  },
  {
    name: 'Comedy',
    subgenres: [
      'Slapstick', 'Satire', 'Parody/Spoof', 'Black Comedy / Dark Comedy', 'Sitcom (Situation Comedy)', 
      'Mockumentary', 'Screwball Comedy', 'Absurdist/Surreal Comedy', 'Cringe Comedy'
    ]
  },
  {
    name: 'Crime, Mystery & Noir',
    subgenres: [
      'Crime & Mystery: Detective/Whodunit', 'Police Procedural', 'Gangster/Mafia', 'Heist/Capet', 
      'True Crime Drama', 'Legal Mystery', 'Cozy Mystery',
      'Noir: Classic Noir', 'Neo-Noir', 'Cyber-Noir', 'Tech-Noir'
    ]
  },
  {
    name: 'Animation',
    subgenres: [
      'Animation: Anime (Shonen, Shojo, Seinen, Josei, Mecha, Isekai)', 'Traditional 2D Animation', 
      '3D/CGI Animation', 'Stop-Motion', 'Claymation', 'Adult Animation'
    ]
  },
  {
    name: 'Historical & War',
    subgenres: [
      'Historical: Biopic (Biographical Drama)', 'Historical Fiction', 'Alternate History', 
      'Biblical/Epic Historical',
      'War: Military Drama', 'Anti-War', 'Combat Action', 'Submarine Warfare', 'Historical War'
    ]
  },
  {
    name: 'Westerns',
    subgenres: [
      'Western: Classic Western', 'Spaghetti Western', 'Revisionist Western', 'Neo-Western', 
      'Space Western', 'Acid Western'
    ]
  },
  {
    name: 'Musical & Dance',
    subgenres: [
      'Musical: Jukebox Musical', 'Rock Opera', 'Backstage Musical', 'Musical Comedy', 'Dance Drama'
    ]
  },
  {
    name: 'Non-Fiction & Television Specific',
    subgenres: [
      'Documentary: True Crime', 'Nature/Wildlife', 'Historical Doc', 'Mockumentary', 'Docuseries', 
      'Investigative',
      'TV/Serial Specific: Reality TV', 'Soap Opera', 'Telenovela', 'Anthology Series', 'Variety Show', 
      'Talk Show', 'Game Show'
    ]
  }
];

export default function MovieCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { view, userId: paramUserId } = useLocalSearchParams<{ view: MovieCollectionType; userId?: string }>();
  const [currentView, setCurrentView] = useState<MovieCollectionType>('main');
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<any[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<any[]>([]);
  const [favoriteSeries, setFavoriteSeries] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ratingMode, setRatingMode] = useState<'general' | 'aspects'>('general');
  const [generalRating, setGeneralRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState({
    story: 0,
    acting: 0,
    cinematography: 0,
    soundtrack: 0,
    atmosphere: 0,
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
              // Check if following
              const { data: followData } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user?.id)
                .eq('following_id', targetUserId)
                .maybeSingle();
              
              const isFollowing = !!followData;

              // Check if follows back
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
            fetchFavoriteActors(targetUserId),
            fetchFavoriteMovies(targetUserId),
            fetchFavoriteSeries(targetUserId)
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

  const getDisplayName = (value: any) => {
    if (!value) return 'Unknown';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.name || value.title || JSON.stringify(value);
    }
    return String(value);
  };

  const fetchSelectedGenres = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('movie_favorites')
        .select('value')
        .eq('user_id', uid)
        .eq('type', 'genre');
      
      if (error) throw error;
      
      if (data) {
        setSelectedGenres(data.map((item: any) => item.value));
      }
    } catch (error: any) {
      console.error('Error fetching movie genres from Supabase:', error);
    }
  };

  const fetchFavoriteActors = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('movie_favorites')
        .select('*')
        .eq('user_id', uid)
        .eq('type', 'actor')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavoriteActors(data || []);
    } catch (error: any) {
      console.error('Error fetching favorite actors:', error);
    }
  };

  const fetchFavoriteMovies = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('movie_favorites')
        .select('*')
        .eq('user_id', uid)
        .eq('type', 'movie')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavoriteMovies(data || []);
    } catch (error: any) {
      console.error('Error fetching favorite movies:', error);
    }
  };

  const fetchFavoriteSeries = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('movie_favorites')
        .select('*')
        .eq('user_id', uid)
        .eq('type', 'tv')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavoriteSeries(data || []);
    } catch (error: any) {
      console.error('Error fetching favorite series:', error);
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
        .from('movie_favorites')
        .update({ metadata: newMetadata })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Update local state
      if (selectedItem.type === 'movie') {
        setFavoriteMovies(prev => prev.map(item => item.id === selectedItem.id ? { ...item, metadata: newMetadata } : item));
      } else {
        setFavoriteSeries(prev => prev.map(item => item.id === selectedItem.id ? { ...item, metadata: newMetadata } : item));
      }

      Alert.alert('Success', 'Rating updated successfully');
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating rating:', error);
      Alert.alert('Error', 'Failed to update rating');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditRating = (item: any) => {
    setSelectedItem(item);
    const rating = item.metadata?.rating;
    if (rating) {
      setRatingMode(rating.mode || 'general');
      if (rating.mode === 'aspects') {
        setAspectRatings({
          story: rating.story || 0,
          acting: rating.acting || 0,
          cinematography: rating.cinematography || 0,
          soundtrack: rating.soundtrack || 0,
          atmosphere: rating.atmosphere || 0,
        });
      } else {
        setGeneralRating(rating.value || 0);
      }
    } else {
      setRatingMode('general');
      setGeneralRating(0);
      setAspectRatings({ story: 0, acting: 0, cinematography: 0, soundtrack: 0, atmosphere: 0 });
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
              <ThemedText type="subtitle" style={{ flex: 1 }}>{selectedItem?.value}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close-circle" size={32} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSection}>
              <ThemedText type="defaultSemiBold" style={{ color: theme.brand, marginBottom: Spacing.two }}>{isOwnProfile ? 'Edit Rating' : 'Rating Details'}</ThemedText>
              
              {isOwnProfile && (
                <View style={styles.ratingModeButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.modeButton, 
                      (ratingMode === 'general' ? { backgroundColor: theme.brand } : undefined)
                    ].filter(Boolean) as any}
                    onPress={() => setRatingMode('general')}
                  >
                    <ThemedText style={[
                      styles.modeButtonText, 
                      (ratingMode === 'general' ? { color: '#fff' } : undefined)
                    ].filter(Boolean) as any}>General</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.modeButton, 
                      (ratingMode === 'aspects' ? { backgroundColor: theme.brand } : undefined)
                    ].filter(Boolean) as any}
                    onPress={() => setRatingMode('aspects')}
                  >
                    <ThemedText style={[
                      styles.modeButtonText, 
                      (ratingMode === 'aspects' ? { color: '#fff' } : undefined)
                    ].filter(Boolean) as any}>By Aspects</ThemedText>
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
                    { key: 'story', label: 'Story' },
                    { key: 'acting', label: 'Acting/Cast Performance' },
                    { key: 'cinematography', label: 'Cinematography & Directing' },
                    { key: 'soundtrack', label: 'Soundtrack' },
                    { key: 'atmosphere', label: 'Atmosphere' }
                  ].map((aspect) => {
                    const ratingValue = (aspectRatings as any)[aspect.key];
                    if (!isOwnProfile && ratingValue === 0) return null;

                    return (
                      <View key={aspect.key} style={styles.aspectItem}>
                        <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                        <View style={styles.aspectStars}>
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
                style={[styles.updateButton, { backgroundColor: theme.brand }]}
                onPress={updateRating}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.updateButtonText}>Update Rating</ThemedText>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );

  const toggleGenre = async (genreValue: string, category: string) => {
    if (!userId) return;

    const isSelected = selectedGenres.includes(genreValue);
    const newSelected = isSelected 
      ? selectedGenres.filter(g => g !== genreValue)
      : [...selectedGenres, genreValue];
    
    setSelectedGenres(newSelected);

    try {
      if (isSelected) {
        const { error } = await supabase
          .from('movie_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'genre')
          .eq('value', genreValue);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('movie_favorites')
          .insert({
            user_id: userId,
            type: 'genre',
            category: category,
            value: genreValue
          });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling movie genre in Supabase:', error);
      // Revert state if DB update fails
      setSelectedGenres(selectedGenres);
      
      Alert.alert(
        'Update Failed',
        'Failed to update your selection. Please try again.'
      );
    }
  };

  const renderMainMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.menuContainer}>
        {/* Favorite Genres Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('genres')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="film" size={24} color={theme.brand} />
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
          </View>
        </View>

        {/* Favorite Actors Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('actors')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="people" size={24} color="#4CD964" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Actors</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewListRow}>
            {favoriteActors.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.actorCard, { backgroundColor: theme.backgroundElement, width: '31%', marginBottom: 0 }]}
                onPress={() => setCurrentView('actors')}
              >
                {item.metadata?.profile_path ? (
                  <Image source={{ uri: item.metadata.profile_path.startsWith('http') ? item.metadata.profile_path : `https://image.tmdb.org/t/p/w500${item.metadata.profile_path}` }} style={[styles.actorImage, { height: 100 }]} />
                ) : item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={[styles.actorImage, { height: 100 }]} />
                ) : (
                  <View style={[styles.actorImage, styles.placeholderActorImage, { height: 100 }]}>
                    <Ionicons name="person" size={32} color={theme.textSecondary} />
                  </View>
                )}
                <View style={[styles.actorInfo, { padding: Spacing.one }]}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 11 }} numberOfLines={1}>{getDisplayName(item.value)}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {favoriteActors.length > 3 && (
            <TouchableOpacity onPress={() => setCurrentView('actors')} style={styles.seeAllFooter}>
              <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteActors.length} items</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Favorite Movies Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('movies')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="videocam" size={24} color="#5856D6" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Movies</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteMovies.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.movieItem, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('movies')}
              >
                {item.metadata?.poster_path ? (
                  <Image source={{ uri: item.metadata.poster_path.startsWith('http') ? item.metadata.poster_path : `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}` }} style={styles.moviePoster} />
                ) : item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={styles.moviePoster} />
                ) : (
                  <View style={[styles.moviePoster, styles.placeholderMoviePoster]}>
                    <Ionicons name="film" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.movieInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{getDisplayName(item.value)}</ThemedText>
                  <ThemedText style={styles.movieSubtext} numberOfLines={1}>
                    {getDisplayName(item.metadata?.year)} {item.metadata?.director ? `• ${getDisplayName(item.metadata.director)}` : ''}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteMovies.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('movies')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteMovies.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Series Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('series')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="tv" size={24} color="#FF9500" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Series</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteSeries.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.movieItem, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('series')}
              >
                {item.metadata?.poster_path ? (
                  <Image source={{ uri: item.metadata.poster_path.startsWith('http') ? item.metadata.poster_path : `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}` }} style={styles.moviePoster} />
                ) : item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={styles.moviePoster} />
                ) : (
                  <View style={[styles.moviePoster, styles.placeholderMoviePoster]}>
                    <Ionicons name="tv" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.movieInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{getDisplayName(item.value)}</ThemedText>
                  <ThemedText style={styles.movieSubtext} numberOfLines={1}>
                    {getDisplayName(item.metadata?.years)} {item.metadata?.creator ? `• ${getDisplayName(item.metadata.creator)}` : ''}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteSeries.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('series')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteSeries.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGenres = () => {
    const filteredGenres = isOwnProfile 
      ? MOVIE_GENRES 
      : MOVIE_GENRES.map(category => ({
          ...category,
          subgenres: category.subgenres.filter(sub => selectedGenres.includes(sub))
        })).filter(category => category.subgenres.length > 0);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredGenres.length > 0 ? (
          filteredGenres.map((category) => (
            <View key={category.name} style={styles.categorySection}>
              <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{category.name}</ThemedText>
              <View style={styles.chipsContainer}>
                {category.subgenres.map((subgenre) => {
                  const isSelected = selectedGenres.includes(subgenre);
                  return (
                    <TouchableOpacity
                      key={subgenre}
                      style={[
                        styles.chip,
                        { backgroundColor: isSelected ? theme.brand : theme.backgroundElement }
                      ]}
                      onPress={() => isOwnProfile && toggleGenre(subgenre, category.name)}
                      disabled={!isOwnProfile}
                    >
                      <ThemedText style={[
                        styles.chipText,
                        { color: isSelected ? '#fff' : theme.text }
                      ]}>
                        {subgenre}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No favorite genres shared yet.</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderActors = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {favoriteActors.length > 0 ? (
        <View style={styles.actorsGrid}>
          {favoriteActors.map((actor) => (
            <View key={actor.id} style={[styles.actorCard, { backgroundColor: theme.backgroundElement }]}>
              {actor.metadata?.profile_path ? (
                <Image 
                  source={{ uri: actor.metadata.profile_path.startsWith('http') ? actor.metadata.profile_path : `https://image.tmdb.org/t/p/w500${actor.metadata.profile_path}` }} 
                  style={styles.actorImage} 
                />
              ) : actor.metadata?.image ? (
                <Image 
                  source={{ uri: actor.metadata.image }} 
                  style={styles.actorImage} 
                />
              ) : (
                <View style={[styles.actorImage, styles.placeholderActorImage]}>
                  <ThemedText style={{ fontSize: 32 }}>👤</ThemedText>
                </View>
              )}
              <View style={styles.actorInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{actor.value}</ThemedText>
                <ThemedText style={styles.actorSubtext} numberOfLines={1}>
                  {actor.metadata?.known_for_department || 'Actor'}
                </ThemedText>
                {isOwnProfile && (
                  <TouchableOpacity 
                    onPress={async () => {
                      const { error } = await supabase
                        .from('movie_favorites')
                        .delete()
                        .eq('id', actor.id);
                      if (!error) {
                        setFavoriteActors(prev => prev.filter(a => a.id !== actor.id));
                      }
                    }}
                    style={styles.removeActorButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <ThemedText style={styles.removeActorText}>Remove</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>{isOwnProfile ? "No favorite actors yet." : "No favorite actors shared yet."}</ThemedText>
          {isOwnProfile && <ThemedText style={styles.emptySubtext}>Search for actors and add them to your favorites!</ThemedText>}
        </View>
      )}
    </ScrollView>
  );

  const renderMovieItems = (items: any[], type: 'movie' | 'tv') => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {items.length > 0 ? (
        <View style={styles.actorsGrid}>
          {items.map((item) => (
            <View key={item.id} style={[styles.actorCard, { backgroundColor: theme.backgroundElement }]}>
              {item.metadata?.poster_path ? (
                <Image 
                  source={{ uri: item.metadata.poster_path.startsWith('http') ? item.metadata.poster_path : `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}` }} 
                  style={styles.actorImage} 
                />
              ) : item.metadata?.image ? (
                <Image 
                  source={{ uri: item.metadata.image }} 
                  style={styles.actorImage} 
                />
              ) : (
                <View style={[styles.actorImage, styles.placeholderActorImage]}>
                  <ThemedText style={{ fontSize: 32 }}>🎬</ThemedText>
                </View>
              )}
              <View style={styles.actorInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                <View style={styles.ratingInfo}>
                  {item.metadata?.rating?.mode === 'general' ? (
                    <TouchableOpacity 
                      onPress={() => openEditRating(item)} 
                      style={styles.starsRow}
                    >
                      {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons 
                          key={s} 
                          name={s <= item.metadata.rating.value ? "star" : "star-outline"} 
                          size={12} 
                          color="#FFD700" 
                        />
                      ))}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => openEditRating(item)}
                    >
                      <ThemedText style={styles.actorSubtext}>
                        {item.metadata?.rating?.mode === 'aspects' ? (isOwnProfile ? 'View/Edit Aspect Rating' : 'View Aspect Rating') : (isOwnProfile ? 'Add Rating' : 'No Rating')}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                {isOwnProfile && (
                  <TouchableOpacity 
                    onPress={async () => {
                      const { error } = await supabase
                        .from('movie_favorites')
                        .delete()
                        .eq('id', item.id);
                      if (!error) {
                        if (type === 'movie') {
                          setFavoriteMovies(prev => prev.filter(i => i.id !== item.id));
                        } else {
                          setFavoriteSeries(prev => prev.filter(i => i.id !== item.id));
                        }
                      }
                    }}
                    style={styles.removeActorButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <ThemedText style={styles.removeActorText}>Remove</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name={type === 'movie' ? "videocam-outline" : "tv-outline"} size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>{isOwnProfile ? `No favorite ${type === 'movie' ? 'movies' : 'series'} yet.` : `No favorite ${type === 'movie' ? 'movies' : 'series'} shared yet.`}</ThemedText>
          {isOwnProfile && <ThemedText style={styles.emptySubtext}>Search for {type === 'movie' ? 'movies' : 'series'} and add them to your favorites!</ThemedText>}
        </View>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => currentView === 'main' ? router.back() : setCurrentView('main')}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">
            {currentView === 'main' ? (isOwnProfile ? 'Movie Collections' : 'Collections') : 
             currentView === 'genres' ? 'Favorite Genres' : 
             currentView === 'actors' ? 'Favorite Actors' :
             currentView === 'movies' ? 'Favorite Movies' :
             currentView === 'series' ? 'Favorite Series' :
             'Collections'}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            {isOwnProfile ? (
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => router.push({
                  pathname: '/findsoulmate',
                  params: { category: 'movie_favorites' }
                })}
              >
                <Ionicons name="heart" size={24} color={theme.brand} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => router.push({
                  pathname: '/compare',
                  params: { userId: userId, userName: 'User', highlightCategory: 'movie_favorites' }
                })}
              >
                <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <>
            {currentView === 'main' && renderMainMenu()}
            {currentView === 'genres' && renderGenres()}
            {currentView === 'actors' && renderActors()}
            {currentView === 'movies' && renderMovieItems(favoriteMovies, 'movie')}
            {currentView === 'series' && renderMovieItems(favoriteSeries, 'tv')}
          </>
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
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
  },
  menuContainer: {
    gap: Spacing.four,
  },
  menuSection: {
    borderRadius: 16,
    overflow: 'hidden',
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
  itemPreviewListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  categorySection: {
    marginBottom: Spacing.five,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
    opacity: 0.8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.half, // Add small padding to prevent cards touching edges
  },
  actorCard: {
    width: '48.5%', // Slightly more width but ensuring 2 fit
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  actorImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  placeholderActorImage: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actorInfo: {
    padding: Spacing.three,
    gap: 4,
  },
  actorSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  removeActorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  removeActorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  ratingInfo: {
    marginTop: 2,
    height: 16,
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
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
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  ratingSection: {
    marginBottom: Spacing.four,
  },
  ratingModeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.four,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  modeButtonText: {
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: Spacing.two,
  },
  aspectsContainer: {
    gap: 16,
  },
  aspectItem: {
    gap: 8,
  },
  aspectLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  aspectStars: {
    flexDirection: 'row',
    gap: 8,
  },
  updateButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    padding: Spacing.two,
    gap: Spacing.three,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  placeholderMoviePoster: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
    gap: 4,
  },
  movieSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
