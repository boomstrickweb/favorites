import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type MusicCollectionType = 'genres' | 'artists_bands' | 'songs_albums' | 'main';

interface GenreData {
  name: string;
  subgenres: string[];
}

const GENRES_DATA: GenreData[] = [
  {
    name: 'Rock & Metal',
    subgenres: [
      'Alternative Rock', 'Indie Rock', 'Grunge', 'Hard Rock', 'Punk Rock', 'Post-Punk', 'Gothic Rock', 
      'Psychedelic Rock', 'Progressive Rock (Prog-Rock)', 'Glam Rock', 'Garage Rock', 'Surf Rock', 'Pop Rock', 
      'Noise Rock', 'Math Rock', 'Stoner Rock', 'Shoegaze', 'Dream Pop', 'Heavy Metal', 'Thrash Metal', 
      'Death Metal', 'Black Metal', 'Power Metal', 'Progressive Metal', 'Symphony Metal', 'Doom Metal', 
      'Sludge Metal', 'Nu Metal', 'Metalcore', 'Deathcore', 'Post-Metal', 'Industrial Metal', 
      'Gothic Metal', 'Folk Metal', 'Grindcore', 'Speed Metal'
    ]
  },
  {
    name: 'Pop',
    subgenres: [
      'Synthpop', 'Electropop', 'Indie Pop', 'Dream Pop', 'Chamber Pop', 'Art Pop', 'Dance-Pop', 'Teen Pop', 
      'Bubblegum Pop', 'Baroque Pop', 'Sophisti-Pop', 'K-Pop (Korean Pop)', 'J-Pop (Japanese Pop)', 
      'C-Pop (Chinese Pop)', 'Europop', 'Latin Pop', 'T-Pop (Turkish Pop)'
    ]
  },
  {
    name: 'Hip-Hop/Rap',
    subgenres: [
      'Boom Bap', 'Trap', 'Drill (Chicago, UK, NY)', 'Gangsta Rap', 'Conscious Hip-Hop', 'Cloud Rap', 
      'Emo Rap', 'Jazz Rap', 'Alternative Hip-Hop', 'Mumble Rap', 'G-Funk', 'West Coast Rap', 
      'East Coast Rap', 'Southern Hip-Hop', 'Grime', 'Horrorcore', 'Instrumental Hip-Hop'
    ]
  },
  {
    name: 'Electronic & Dance',
    subgenres: [
      'Deep House', 'Tech House', 'Progressive House', 'Electro House', 'Acid House', 'Chicago House', 
      'Future House', 'Tropical House', 'G-House', 'Berlin Techno', 'Detroit Techno', 'Dub Techno', 
      'Acid Techno', 'Industrial Techno', 'Minimal Techno', 'Peak Time Techno', 'Hardtechno', 
      'Uplifting Trance', 'Psytrance (Psychedelic Trance)', 'Progressive Trance', 'Goa Trance', 'Vocal Trance', 
      'Dubstep', 'Brostep', 'Drum and Bass (DnB)', 'Liquid DnB', 'Neurofunk', 'UK Garage (UKG)', '2-Step', 
      'Future Bass', 'Trap (EDM)', 'Ambient', 'Drone', 'Chillout', 'Downtempo', 'Trip-Hop', 'Lo-Fi Hip-Hop', 
      'Vaporwave', 'Synthwave', 'Retrowave', 'New Age', 'Happy Hardcore', 'Gabber', 'Hardstyle', 'Frenchcore'
    ]
  },
  {
    name: 'R&B, Soul & Funk',
    subgenres: [
      'Contemporary R&B', 'Neo-Soul', 'Classic Soul', 'Motown', 'Funk', 'P-Funk', 'Disco', 'Nu-Disco', 
      'Quiet Storm', 'Gospel'
    ]
  },
  {
    name: 'Jazz & Blues',
    subgenres: [
      'Traditional Jazz (Dixieland)', 'Swing', 'Bebop', 'Hard Bop', 'Cool Jazz', 'Modal Jazz', 'Free Jazz', 
      'Avant-Garde Jazz', 'Fusion (Jazz-Rock)', 'Smooth Jazz', 'Acid Jazz', 'Gypsy Jazz', 'Vocal Jazz', 
      'Bossa Nova', 'Delta Blues', 'Chicago Blues', 'Texas Blues', 'Electric Blues', 'Blues Rock', 
      'Soul Blues', 'Jump Blues'
    ]
  },
  {
    name: 'Country, Folk & Americana',
    subgenres: [
      'Traditional Country', 'Outlaw Country', 'Honky-Tonk', 'Bluegrass', 'Country Pop', 'Country Rock', 
      'Bro-Country', 'Americana', 'Traditional Folk', 'Contemporary Folk', 'Indie Folk', 'Folk Rock', 
      'Anti-Folk', 'Celtic Folk', 'Psychedelic Folk'
    ]
  },
  {
    name: 'Reggae & Caribbean',
    subgenres: [
      'Roots Reggae', 'Dub', 'Dancehall', 'Ska', 'Rocksteady', 'Reggaeton', 'Soca', 'Calypso'
    ]
  },
  {
    name: 'Classical & Avant-Garde',
    subgenres: [
      'Early Music', 'Medieval', 'Renaissance', 'Baroque', 'Classical Period', 'Romantic Period', 
      'Modern Classical', 'Neoclassical', 'Minimalist Classical', 'Opera', 'Orchestral', 'Choral', 
      'Chamber Music'
    ]
  },
  {
    name: 'World, Regional & Traditional',
    subgenres: [
      'Salsa', 'Bachata', 'Merengue', 'Cumbia', 'Samba', 'Bossa Nova', 'Flamenco', 'Tango', 'Latin Jazz', 
      'Mariachi', 'Afrobeat', 'Highlife', 'Desert Blues', 'Kuduro', 'Amapiano', 'Soukous', 'Juju', 
      'Mugham (Azerbaijani Traditional)', 'Meyxana', 'Turkish Folk (Türkü)', 'Arabesque', 'Anatolian Rock', 
      'Persian Classical', 'Rai', 'Indian Classical (Hindustani & Carnatic)', 'Ghazal', 'Qawwali', 
      'Enka', 'Gagaku'
    ]
  }
];

export default function MusicCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [currentView, setCurrentView] = useState<MusicCollectionType>('main');
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteArtistsBands, setFavoriteArtistsBands] = useState<any[]>([]);
  const [favoriteSongsAlbums, setFavoriteSongsAlbums] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingMode, setRatingMode] = useState<'general' | 'aspects'>('general');
  const [generalRating, setGeneralRating] = useState(0);
  const [musicAspectRatings, setMusicAspectRatings] = useState({
    vocals: 0,
    melody: 0,
    lyrics: 0,
    production: 0,
    vibe: 0,
  });
  const [updatingRating, setUpdatingRating] = useState(false);

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

          await fetchCollections(targetUserId);
        }
      } catch (error: any) {
        console.error('Error setting up music collections:', error.message);
      } finally {
        setLoading(false);
      }
    }
    setupCollections();
  }, [paramUserId]);

  const fetchCollections = async (uid: string) => {
    try {
      // Fetch genres
      const { data: genreData, error: genreError } = await supabase
        .from('music_favorites')
        .select('value')
        .eq('user_id', uid)
        .eq('type', 'genre');
      
      if (genreError) throw genreError;
      if (genreData) setSelectedGenres(genreData.map((item: any) => item.value));

      // Fetch artists and bands
      const { data: artistData, error: artistError } = await supabase
        .from('music_favorites')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['artist', 'band']);
      
      if (artistError) throw artistError;
      if (artistData) setFavoriteArtistsBands(artistData);

      // Fetch songs and albums
      const { data: songAlbumData, error: songAlbumError } = await supabase
        .from('music_favorites')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['song', 'album']);
      
      if (songAlbumError) throw songAlbumError;
      if (songAlbumData) setFavoriteSongsAlbums(songAlbumData);

    } catch (error: any) {
      console.error('Error fetching collections from Supabase:', error);
      Alert.alert('Database Error', 'Failed to fetch music collections.');
    }
  };

  const removeFavoriteItem = async (itemId: string, listType: 'artists_bands' | 'songs_albums') => {
    try {
      const { error } = await supabase
        .from('music_favorites')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      if (listType === 'artists_bands') {
        setFavoriteArtistsBands(prev => prev.filter(a => a.id !== itemId));
      } else {
        setFavoriteSongsAlbums(prev => prev.filter(a => a.id !== itemId));
      }
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const openRatingModal = (item: any) => {
    if (!isOwnProfile) return;
    setSelectedItem(item);
    const rating = item.metadata?.rating;
    if (rating) {
      setRatingMode(rating.mode || 'general');
      if (rating.mode === 'aspects') {
        setMusicAspectRatings({
          vocals: rating.vocals || 0,
          melody: rating.melody || 0,
          lyrics: rating.lyrics || 0,
          production: rating.production || rating.production_mix || 0, // Handle potential naming variations
          vibe: rating.vibe || 0,
        });
        setGeneralRating(0);
      } else {
        setGeneralRating(rating.value || 0);
        setMusicAspectRatings({ vocals: 0, melody: 0, lyrics: 0, production: 0, vibe: 0 });
      }
    } else {
      setRatingMode('general');
      setGeneralRating(0);
      setMusicAspectRatings({ vocals: 0, melody: 0, lyrics: 0, production: 0, vibe: 0 });
    }
    setShowRatingModal(true);
  };

  const saveRating = async () => {
    if (!selectedItem || !userId) return;

    setUpdatingRating(true);
    try {
      const ratingData = ratingMode === 'general' 
        ? { mode: 'general', value: generalRating }
        : { mode: 'aspects', ...musicAspectRatings };

      const updatedMetadata = {
        ...selectedItem.metadata,
        rating: ratingData
      };

      const { error } = await supabase
        .from('music_favorites')
        .update({ metadata: updatedMetadata })
        .eq('id', selectedItem.id);

      if (error) throw error;

      setFavoriteSongsAlbums(prev => prev.map(item => 
        item.id === selectedItem.id ? { ...item, metadata: updatedMetadata } : item
      ));

      setShowRatingModal(false);
      Alert.alert('Success', 'Rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      Alert.alert('Error', 'Failed to update rating');
    } finally {
      setUpdatingRating(false);
    }
  };

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
          .from('music_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'genre')
          .eq('value', genreValue);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('music_favorites')
          .insert({
            user_id: userId,
            type: 'genre',
            category: category,
            value: genreValue
          });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling genre in Supabase:', error);
      // Revert state if DB update fails
      setSelectedGenres(selectedGenres);
      
      Alert.alert(
        'Update Failed',
        'Failed to update your selection in the database. Please try again.'
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
              <Ionicons name="musical-notes" size={24} color={theme.brand} />
              <ThemedText style={styles.previewSectionTitle}>Favorite Genres</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.genrePreviewGrid}>
            {selectedGenres.slice(0, 3).map((genre, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.subgenreChip, { backgroundColor: theme.backgroundElement }]}
                onPress={() => setCurrentView('genres')}
              >
                <ThemedText style={styles.subgenreText}>{genre}</ThemedText>
              </TouchableOpacity>
            ))}
            {selectedGenres.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('genres')} style={styles.seeAllInline}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Artists & Bands Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('artists_bands')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="people" size={24} color="#4CD964" />
              <ThemedText style={styles.previewSectionTitle}>Artists, Bands & Duos</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteArtistsBands.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.artistCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('artists_bands')}
              >
                {item.metadata?.image ? (
                  <View style={styles.artistImageContainer}>
                    <Image source={{ uri: item.metadata.image }} style={styles.artistImage} />
                  </View>
                ) : (
                  <View style={[styles.artistImage, styles.placeholderArtistImage]}>
                    <ThemedText style={{ fontSize: 24 }}>{item.type === 'band' ? '👥' : '👤'}</ThemedText>
                  </View>
                )}
                <View style={styles.artistInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                  <ThemedText style={styles.artistSubtext} numberOfLines={1}>
                    {item.metadata?.type || (item.type === 'artist' ? 'Artist' : 'Band')}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteArtistsBands.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('artists_bands')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteArtistsBands.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Songs & Albums Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('songs_albums')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="musical-note" size={24} color="#FF2D55" />
              <ThemedText style={styles.previewSectionTitle}>Songs & Albums</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteSongsAlbums.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.artistCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('songs_albums')}
              >
                {item.metadata?.image ? (
                  <View style={[styles.artistImageContainer, { borderRadius: 8 }]}>
                    <Image source={{ uri: item.metadata.image }} style={[styles.artistImage, { borderRadius: 8 }]} />
                  </View>
                ) : (
                  <View style={[styles.artistImage, styles.placeholderArtistImage, { borderRadius: 8 }]}>
                    <ThemedText style={{ fontSize: 24 }}>{item.type === 'album' ? '💿' : '🎵'}</ThemedText>
                  </View>
                )}
                <View style={styles.artistInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                  <ThemedText style={styles.artistSubtext} numberOfLines={1}>
                    {item.metadata?.artist || (item.type === 'album' ? 'Album' : 'Song')}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteSongsAlbums.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('songs_albums')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteSongsAlbums.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderGenresMenu = () => {
    const filteredGenres = isOwnProfile 
      ? GENRES_DATA 
      : GENRES_DATA.map(genre => ({
          ...genre,
          subgenres: genre.subgenres.filter(sub => selectedGenres.includes(sub))
        })).filter(genre => genre.subgenres.length > 0 || selectedGenres.includes(genre.name));

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredGenres.length > 0 ? (
          filteredGenres.map((genre) => (
            <View key={genre.name} style={styles.genreSection}>
              <TouchableOpacity 
                style={[
                  styles.genreHeader, 
                  { backgroundColor: theme.backgroundElement },
                  selectedGenres.includes(genre.name) && { borderColor: theme.brand, borderWidth: 1 }
                ]}
                onPress={() => isOwnProfile && toggleGenre(genre.name, genre.name)}
                disabled={!isOwnProfile}
              >
                <ThemedText type="defaultSemiBold">{genre.name}</ThemedText>
                {selectedGenres.includes(genre.name) && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.brand} />
                )}
              </TouchableOpacity>
              
              <View style={styles.subgenreGrid}>
                {genre.subgenres.map((sub) => {
                  const isSelected = selectedGenres.includes(sub);
                  if (!isOwnProfile && !isSelected) return null;
                  return (
                    <TouchableOpacity 
                      key={sub}
                      style={[
                        styles.subgenreChip,
                        { backgroundColor: theme.backgroundElement },
                        isSelected ? { backgroundColor: theme.brand } : undefined
                      ].filter(Boolean) as any}
                      onPress={() => isOwnProfile && toggleGenre(sub, genre.name)}
                      disabled={!isOwnProfile}
                    >
                      <ThemedText 
                        style={[
                          styles.subgenreText,
                          isSelected ? { color: '#ffffff' } : undefined
                        ].filter(Boolean) as any}
                      >
                        {sub}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No favorite genres shared yet.</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderArtistsBandsMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {favoriteArtistsBands.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No favorites yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>Search for artists or bands and add them to your favorites!</ThemedText>
        </View>
      ) : (
        <View style={styles.artistGrid}>
          {favoriteArtistsBands.map((item) => (
            <View key={item.id} style={[styles.artistCard, { backgroundColor: theme.backgroundElement }]}>
              {item.metadata?.image ? (
                <View style={styles.artistImageContainer}>
                  <Image source={{ uri: item.metadata.image }} style={styles.artistImage} />
                </View>
              ) : (
                <View style={[styles.artistImage, styles.placeholderArtistImage]}>
                  <ThemedText style={{ fontSize: 32 }}>{item.type === 'band' ? '👥' : '👤'}</ThemedText>
                </View>
              )}
              <View style={styles.artistInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                <ThemedText style={styles.artistSubtext} numberOfLines={1}>
                  {item.metadata?.type || (item.type === 'artist' ? 'Artist' : 'Band')} {item.metadata?.country ? `• ${item.metadata.country}` : ''}
                </ThemedText>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.removeArtistButton}
                    onPress={() => removeFavoriteItem(item.id, 'artists_bands')}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    <ThemedText style={styles.removeText}>Remove</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderSongsAlbumsMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {favoriteSongsAlbums.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-note" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No favorites yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>Search for songs or albums and add them to your favorites!</ThemedText>
        </View>
      ) : (
        <View style={styles.artistGrid}>
          {favoriteSongsAlbums.map((item) => (
            <View key={item.id} style={[styles.artistCard, { backgroundColor: theme.backgroundElement }]}>
              {item.metadata?.image ? (
                <View style={[styles.artistImageContainer, { borderRadius: 8 }]}>
                  <Image source={{ uri: item.metadata.image }} style={[styles.artistImage, { borderRadius: 8 }]} />
                </View>
              ) : (
                <View style={[styles.artistImage, styles.placeholderArtistImage, { borderRadius: 8 }]}>
                  <ThemedText style={{ fontSize: 32 }}>{item.type === 'album' ? '💿' : '🎵'}</ThemedText>
                </View>
              )}
              <View style={styles.artistInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                <ThemedText style={styles.artistSubtext} numberOfLines={1}>
                  {item.type === 'album' ? 'Album' : 'Song'} {item.metadata?.artist ? `• ${item.metadata.artist}` : ''}
                </ThemedText>
                
                {item.metadata?.rating && (
                  <TouchableOpacity 
                    style={styles.ratingDisplay}
                    onPress={() => !isOwnProfile && openRatingModal(item)}
                  >
                    {item.metadata.rating.mode === 'aspects' ? (
                      <View style={styles.aspectsSmallList}>
                        {[
                          { key: 'vocals', icon: 'mic-outline' },
                          { key: 'melody', icon: 'musical-notes-outline' },
                          { key: 'lyrics', icon: 'text-outline' },
                          { key: 'production', icon: 'options-outline' },
                          { key: 'vibe', icon: 'heart-outline' }
                        ].map((aspect) => (
                          <View key={aspect.key} style={styles.aspectSmallItem}>
                            <Ionicons name={aspect.icon as any} size={10} color={theme.textSecondary} />
                            <View style={styles.starsRow}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons 
                                  key={star} 
                                  name={star <= (item.metadata.rating[aspect.key] || 0) ? "star" : "star-outline"} 
                                  size={8} 
                                  color={star <= (item.metadata.rating[aspect.key] || 0) ? "#FFD700" : theme.textSecondary} 
                                />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons 
                            key={star} 
                            name={star <= (item.metadata.rating.value || 0) ? "star" : "star-outline"} 
                            size={14} 
                            color={star <= (item.metadata.rating.value || 0) ? "#FFD700" : theme.textSecondary} 
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {isOwnProfile && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openRatingModal(item)}
                    >
                      <Ionicons name="star-outline" size={18} color={theme.brand} />
                      <ThemedText style={[styles.actionText, { color: theme.brand }]}>Rate</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => removeFavoriteItem(item.id, 'songs_albums')}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <ThemedText style={[styles.actionText, { color: '#FF3B30' }]}>Remove</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: currentView === 'main' ? 'Music Collections' : 
                 currentView === 'genres' ? 'Favorite Genres' : 
                 currentView === 'artists_bands' ? 'Artists & Bands' :
                 currentView === 'songs_albums' ? 'Songs & Albums' : 'Music',
          headerLeft: currentView !== 'main' ? () => (
            <TouchableOpacity onPress={() => setCurrentView('main')}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ) : undefined,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginRight: Spacing.two }}>
              {isOwnProfile ? (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/findsoulmate',
                    params: { category: 'music_favorites' }
                  })}
                >
                  <Ionicons name="heart" size={24} color={theme.brand} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/compare',
                    params: { userId: userId, userName: 'User', highlightCategory: 'music_favorites' }
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
        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={theme.brand} /></View>
        ) : (
          currentView === 'main' ? renderMainMenu() : 
          currentView === 'genres' ? renderGenresMenu() :
          currentView === 'artists_bands' ? renderArtistsBandsMenu() :
          currentView === 'songs_albums' ? renderSongsAlbumsMenu() : null
        )}
      </SafeAreaView>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle">{isOwnProfile ? 'Edit Rating' : 'Rating Details'}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>{selectedItem?.value}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.ratingSection}>
                {isOwnProfile && <ThemedText style={styles.modalSubtext}>How would you like to rate this?</ThemedText>}
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

                {ratingMode === 'general' ? (
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity 
                        key={star} 
                        onPress={() => isOwnProfile && setGeneralRating(star)}
                        disabled={!isOwnProfile}
                      >
                        <Ionicons 
                          name={star <= generalRating ? "star" : "star-outline"} 
                          size={40} 
                          color={star <= generalRating ? "#FFD700" : theme.text} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.aspectsContainer}>
                    {[
                      { key: 'vocals', label: 'Vocals' },
                      { key: 'melody', label: 'Melody' },
                      { key: 'lyrics', label: 'Lyrics' },
                      { key: 'production', label: 'Production & Mix' },
                      { key: 'vibe', label: 'Vibe' }
                    ].map((aspect) => {
                      const ratingValue = (musicAspectRatings as any)[aspect.key];
                      if (!isOwnProfile && ratingValue === 0) return null;

                      return (
                        <View key={aspect.key} style={styles.aspectItem}>
                          <ThemedText style={styles.aspectLabel}>{aspect.label}</ThemedText>
                          <View style={styles.aspectStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity 
                                key={star} 
                                onPress={() => isOwnProfile && setMusicAspectRatings(prev => ({ ...prev, [aspect.key]: star }))}
                                disabled={!isOwnProfile}
                              >
                                <Ionicons 
                                  name={star <= ratingValue ? "star" : "star-outline"} 
                                  size={28} 
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
            </ScrollView>

            {isOwnProfile && (
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.brand }]}
                onPress={saveRating}
                disabled={updatingRating}
              >
                {updatingRating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Rating</ThemedText>
                )}
              </TouchableOpacity>
            )}
          </ThemedView>
        </View>
      </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.three,
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
  seeAllFooter: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
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
  genreSection: {
    marginBottom: Spacing.five,
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  subgenreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingLeft: Spacing.two,
  },
  subgenreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: Spacing.one,
  },
  subgenreText: {
    fontSize: 13,
  },
  artistGrid: {
    gap: Spacing.three,
  },
  artistCard: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    gap: Spacing.three,
  },
  artistImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderArtistImage: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
    gap: 2,
  },
  artistSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  removeArtistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingDisplay: {
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  aspectsSmallList: {
    gap: 2,
  },
  aspectSmallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing.three,
  },
  ratingSection: {
    marginBottom: Spacing.four,
  },
  ratingModeButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
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
    paddingVertical: Spacing.four,
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
    fontSize: 15,
  },
  aspectStars: {
    flexDirection: 'row',
    gap: 4,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.7,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: Spacing.three,
  },
});
