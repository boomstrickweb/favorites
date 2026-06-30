import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

type BookCollectionType = 'genres' | 'authors' | 'books' | 'main';

interface GenreData {
  name: string;
  subgenres: string[];
}

const GENRES_DATA: GenreData[] = [
  {
    name: 'Fiction & Literature',
    subgenres: ['Literary Fiction', 'Contemporary Fiction', 'Historical Fiction', 'Magical Realism', 'Satire', 'Short Story', 'Epistolary', 'Coming-of-Age', 'Picaresque', 'Classic Literature', 'Southern Gothic', 'Transgressive Fiction']
  },
  {
    name: 'Science Fiction (Sci-Fi)',
    subgenres: ['Cyberpunk', 'Steampunk', 'Space Opera', 'Hard Science Fiction', 'Military Science Fiction', 'Dystopian', 'Post-Apocalyptic', 'Time Travel', 'Near-Future Sci-Fi', 'Solarpunk', 'Biopunk', 'Alien Invasion', 'Afrofuturism']
  },
  {
    name: 'Fantasy',
    subgenres: ['High Fantasy', 'Epic Fantasy', 'Dark Fantasy', 'Urban Fantasy', 'Sword and Sorcery', 'Grimdark Fantasy', 'Portal Fantasy', 'Paranormal Romance', 'Gaslamp Fantasy', 'Mythic Fantasy', 'Fairy Tale Retelling', 'Historical Fantasy']
  },
  {
    name: 'Mystery, Thriller & Crime',
    subgenres: ['Whodunit', 'Police Procedural', 'Legal Thriller', 'Psychological Thriller', 'Techno-Thriller', 'Noir', 'Neo-Noir', 'Hardboiled', 'Cozy Mystery', 'Spy Fiction', 'Espionage', 'Political Thriller', 'Medical Thriller', 'Heist', 'Locked Room Mystery']
  },
  {
    name: 'Horror',
    subgenres: ['Gothic Horror', 'Slasher', 'Psychological Horror', 'Supernatural Horror', 'Cosmic Horror', 'Lovecraftian', 'Body Horror', 'Folk Horror', 'Splatterpunk', 'Quiet Horror', 'Ghost Stories', 'Occult Fiction']
  },
  {
    name: 'Romance',
    subgenres: ['Contemporary Romance', 'Historical Romance', 'Regency Romance', 'Romantic Comedy (Rom-Com)', 'Paranormal Romance', 'Dark Romance', 'Steamy Romance', 'Sports Romance', 'Workplace Romance', 'Clean Romance', 'Western Romance']
  },
  {
    name: 'Action & Adventure',
    subgenres: ['Survival Fiction', 'Nautical Fiction (Sea Adventure)', 'War Fiction', 'Military Fiction', 'Treasure Hunt', 'Espionage', 'Superhero Fiction', 'Swashbuckler', 'Wilderness Adventure']
  },
  {
    name: 'Young Adult (YA) & New Adult',
    subgenres: ['YA Fantasy', 'YA Dystopian', 'YA Romance', 'YA Mystery', 'New Adult Romance', 'Teen Drama', 'Coming-of-Age YA']
  },
  {
    name: 'Children’s Books',
    subgenres: ['Picture Books', 'Middle Grade (MG) Fiction', 'Fairy Tales', 'Nursery Rhymes', 'Fables', 'Early Reader', 'Mythology for Kids']
  },
  {
    name: 'Non-Fiction',
    subgenres: ['Biography', 'Autobiography', 'Memoir', 'True Crime', 'Self-Help', 'Psychology', 'Philosophy', 'Sociology', 'History', 'World History', 'Military History', 'Science', 'Nature', 'Environment', 'Travel Writing', 'Essays', 'Journalism']
  },
  {
    name: 'Business, Tech & Economics',
    subgenres: ['Business Strategy', 'Entrepreneurship', 'Personal Finance', 'Economics', 'Cryptography', 'Technology', 'Computer Science', 'Marketing', 'Leadership', 'Management']
  },
  {
    name: 'Religion, Spirituality & Philosophy',
    subgenres: ['Theology', 'Eastern Philosophy', 'Stoicism', 'Existentialism', 'Ethics', 'Spirituality', 'New Age', 'Astrology', 'Occultism', 'Mythology']
  },
  {
    name: 'Art, Food & Lifestyle',
    subgenres: ['Cookbooks', 'Gastronomy', 'Art History', 'Photography', 'Interior Design', 'Fashion', 'Gardening', 'DIY', 'Crafts', 'Music', 'Sports & Outdoors', 'Fitness']
  },
  {
    name: 'Graphic Novels & Comics',
    subgenres: ['Manga (Shonen, Shojo, Seinen, Josei)', 'Superhero Comics', 'Graphic Memoirs', 'Indie Comics', 'Webtoons', 'Bande Dessinée']
  },
  {
    name: 'Poetry & Drama',
    subgenres: ['Lyrical Poetry', 'Epic Poetry', 'Haiku', 'Sonnets', 'Spoken Word', 'Playwriting', 'Screenwriting', 'Tragedy', 'Comedy', 'Verse Drama']
  }
];

export default function BookCollectionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams<{ userId?: string }>();
  const [currentView, setCurrentView] = useState<BookCollectionType>('main');
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<{category: string, value: string}[]>([]);
  const [favoriteAuthors, setFavoriteAuthors] = useState<any[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);
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
        .from('book_favorites')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) throw error;

      if (data) {
        setSelectedGenres(data.filter((item: any) => item.type === 'genre').map((item: any) => ({
          category: item.category,
          value: item.value
        })));
        setFavoriteAuthors(data.filter((item: any) => item.type === 'author'));
        setFavoriteBooks(data.filter((item: any) => item.type === 'book'));
      }
    } catch (error: any) {
      console.error('Error fetching book collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = async (category: string, subgenre: string) => {
    if (!userId || !isOwnProfile) return;

    const isSelected = selectedGenres.some(g => g.category === category && g.value === subgenre);

    try {
      if (isSelected) {
        const { error } = await supabase
          .from('book_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'genre')
          .eq('category', category)
          .eq('value', subgenre);

        if (error) throw error;
        setSelectedGenres(prev => prev.filter(g => !(g.category === category && g.value === subgenre)));
      } else {
        const { error } = await supabase
          .from('book_favorites')
          .insert({
            user_id: userId,
            type: 'genre',
            category: category,
            value: subgenre
          });

        if (error) throw error;
        setSelectedGenres(prev => [...prev, { category, value: subgenre }]);
      }
    } catch (error) {
      console.error('Error toggling genre:', error);
      Alert.alert('Error', 'Failed to update genre');
    }
  };

  const removeFavorite = async (id: string, type: 'author' | 'book') => {
    if (!isOwnProfile) return;
    try {
      const { error } = await supabase
        .from('book_favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (type === 'author') {
        setFavoriteAuthors(prev => prev.filter(a => a.id !== id));
      } else {
        setFavoriteBooks(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove favorite');
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
              <Ionicons name="library" size={24} color="#FF9500" />
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
                <ThemedText style={styles.chipText}>{genre.value}</ThemedText>
              </TouchableOpacity>
            ))}
            {selectedGenres.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('genres')} style={styles.seeAllInline}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See All</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Authors Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('authors')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person" size={24} color="#5856D6" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Authors</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteAuthors.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.card, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('authors')}
              >
                {item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={[styles.cardImage, { width: 60, height: 60, borderRadius: 30 }]} />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage, { width: 60, height: 60, borderRadius: 30 }]}>
                    <Ionicons name="person" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={[styles.cardInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteAuthors.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('authors')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteAuthors.length} items</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Favorite Books Preview */}
        <View style={styles.previewSection}>
          <TouchableOpacity 
            style={styles.previewSectionHeader}
            onPress={() => setCurrentView('books')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="book" size={24} color="#FF2D55" />
              <ThemedText style={styles.previewSectionTitle}>Favorite Books</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.itemPreviewList}>
            {favoriteBooks.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.card, { backgroundColor: theme.backgroundElement, width: '100%', flexDirection: 'row', marginBottom: Spacing.two }]}
                onPress={() => setCurrentView('books')}
              >
                {item.metadata?.image ? (
                  <Image source={{ uri: item.metadata.image }} style={[styles.cardImage, { width: 60, height: 80, borderRadius: 4 }]} />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage, { width: 60, height: 80, borderRadius: 4 }]}>
                    <Ionicons name="book" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={[styles.cardInfo, { flex: 1, paddingLeft: Spacing.three }]}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.value}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
            {favoriteBooks.length > 3 && (
              <TouchableOpacity onPress={() => setCurrentView('books')} style={styles.seeAllFooter}>
                <ThemedText style={[styles.seeAllText, { color: theme.brand }]}>See all {favoriteBooks.length} items</ThemedText>
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
      : GENRES_DATA.map(category => ({
          ...category,
          subgenres: category.subgenres.filter(subgenre => 
            selectedGenres.some(g => g.category === category.name && g.value === subgenre)
          )
        })).filter(category => category.subgenres.length > 0);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredGenres.length > 0 ? (
          filteredGenres.map((category) => (
            <View key={category.name} style={styles.genreSection}>
              <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{category.name}</ThemedText>
              <View style={styles.chipsContainer}>
                {category.subgenres.map((subgenre) => {
                  const isSelected = selectedGenres.some(g => g.category === category.name && g.value === subgenre);
                  return (
                    <TouchableOpacity
                      key={subgenre}
                      style={[
                        styles.chip,
                        { backgroundColor: isSelected ? '#FF9500' : theme.backgroundElement }
                      ]}
                      onPress={() => isOwnProfile && toggleGenre(category.name, subgenre)}
                      disabled={!isOwnProfile}
                    >
                      <ThemedText style={[styles.chipText, isSelected ? { color: '#fff' } : undefined].filter(Boolean) as any}>
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
            <Ionicons name="book-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No favorite genres shared yet.</ThemedText>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderAuthorsMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {favoriteAuthors.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="person" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No favorite authors yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>Search for authors and add them to your favorites!</ThemedText>
        </View>
      ) : (
        <View style={styles.grid}>
          {favoriteAuthors.map((author) => (
            <View key={author.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              {author.metadata?.image ? (
                <Image source={{ uri: author.metadata.image }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                  <ThemedText style={{ fontSize: 32 }}>👤</ThemedText>
                </View>
              )}
              <View style={styles.cardInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{author.value}</ThemedText>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFavorite(author.id, 'author')}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
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

  const renderBooksMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {favoriteBooks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No favorite books yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>Search for books and add them to your favorites!</ThemedText>
        </View>
      ) : (
        <View style={styles.grid}>
          {favoriteBooks.map((book) => (
            <View key={book.id} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              {book.metadata?.image ? (
                <Image source={{ uri: book.metadata.image }} style={styles.cardImage} resizeMode="contain" />
              ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                  <ThemedText style={{ fontSize: 32 }}>📚</ThemedText>
                </View>
              )}
              <View style={styles.cardInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={2}>{book.value}</ThemedText>
                <ThemedText style={styles.authorText} numberOfLines={1}>{book.metadata?.author}</ThemedText>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFavorite(book.id, 'book')}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
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

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: currentView === 'main' ? 'Book Collections' : 
                 currentView === 'genres' ? 'Favorite Genres' : 
                 currentView === 'authors' ? 'Favorite Authors' : 'Favorite Books',
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
                    params: { category: 'book_favorites' }
                  })}
                >
                  <Ionicons name="heart" size={24} color={theme.brand} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: '/compare',
                    params: { userId: userId, userName: 'User', highlightCategory: 'book_favorites' }
                  })}
                >
                  <Ionicons name="swap-horizontal" size={24} color={theme.brand} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }} 
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9500" />
          </View>
        ) : (
          currentView === 'main' ? renderMainMenu() : 
          currentView === 'genres' ? renderGenresMenu() :
          currentView === 'authors' ? renderAuthorsMenu() :
          renderBooksMenu()
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
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
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.two,
    paddingTop: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  genreSection: {
    marginBottom: Spacing.three,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: Spacing.one,
    marginLeft: Spacing.half,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 10,
  },
  authorText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#FF3B30',
  },
});
