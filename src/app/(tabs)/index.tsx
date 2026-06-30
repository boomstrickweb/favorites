import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Share, Image, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';
import { 
  getMovieDetails, 
  getTVShowDetails, 
  getPersonDetails, 
  getArtistDetails, 
  getAlbumDetails, 
  getSongDetails, 
  getAuthorDetails, 
  getBookDetails 
} from '@/lib/api';

interface Post {
  id: string;
  user_id: string;
  catalog_type: string;
  metadata: {
    value: string;
    type: string;
    category?: string;
    image?: string;
    poster_path?: string;
    profile_path?: string;
    avatar_url?: string;
    cover_medium?: string;
    team_logo?: string;
    league_logo?: string;
  };
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}


export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
    fetchPosts();
  }, []);


  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // 1. Get the list of IDs of users we follow
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followedUserIds = followingData?.map(f => f.following_id) || [];
      // Always include our own posts
      const usersToSee = [...followedUserIds, user.id];

      // 2. Fetch posts only from followed users and ourselves
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url),
          likes:likes(count),
          comments:comments(count)
        `)
        .in('user_id', usersToSee)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check if current user has liked each post
      let postsWithLikes = data || [];
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
        
        postsWithLikes = postsWithLikes.map((post: any) => ({
          ...post,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        postsWithLikes = postsWithLikes.map((post: any) => ({
          ...post,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
          user_has_liked: false
        }));
      }

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const toggleLike = async (post: Post) => {
    if (!userId) return;

    try {
      if (post.user_has_liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: userId });
      }

      // Optimistic update
      setPosts(currentPosts => 
        currentPosts.map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                user_has_liked: !p.user_has_liked, 
                likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1 
              } 
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async (post: Post) => {
    try {
      const itemImage = (post.metadata as any).image || (post.metadata as any).poster_path || (post.metadata as any).profile_path || (post.metadata as any).avatar_url || (post.metadata as any).cover_medium || (post.metadata as any).team_logo || (post.metadata as any).league_logo;
      let imageUrl = itemImage;

      if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
        imageUrl = `https://image.tmdb.org/t/p/w500${imageUrl}`;
      }

      const message = `Check out what ${post.profiles.username} added to their ${post.catalog_type} favorites: ${post.metadata.value}!`;

      if (imageUrl && Platform.OS !== 'web') {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const localUri = `${(FileSystem as any).cacheDirectory}share_image.${fileExtension}`;
          
          const downloadRes = await (FileSystem as any).downloadAsync(imageUrl, localUri);
          
          await Sharing.shareAsync(downloadRes.uri, {
            dialogTitle: `Share ${post.metadata.value}`,
            mimeType: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`,
            UTI: `public.${fileExtension === 'png' ? 'png' : 'jpeg'}`,
          });
          return;
        }
      }

      // Fallback to standard share for web or if image sharing is unavailable
      await Share.share({
        message: imageUrl ? `${message}\n\n${imageUrl}` : message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback if everything fails
      try {
        await Share.share({
          message: `Check out ${post.metadata.value} on Favorites App!`,
        });
      } catch (e) {
        console.error('Final share fallback failed:', e);
      }
    }
  };

  const navigateToDetails = (post: Post) => {
    const routeMap: Record<string, string> = {
      'movie': '/moviecollections',
      'music': '/musiccollections',
      'book': '/bookcollections',
      'sports': '/sportscollections',
      'food': '/foodcollections',
      'places': '/placescollections',
      'vehicles': '/vehiclecollections',
      'games': '/gamescollections',
    };

    const route = routeMap[post.catalog_type];
    if (route) {
      // We pass the type as a view parameter if the collection supports it
      const view = post.metadata.type ? `?view=${post.metadata.type === 'tv' ? 'series' : (post.metadata.type + 's')}&userId=${post.user_id}` : `?userId=${post.user_id}`;
      router.push(`${route}${view}` as any);
    }
  };

  const navigateToProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const showItemDetails = async (post: Post) => {
    setDetailLoading(true);
    try {
      let details = null;
      const { catalog_type, metadata } = post;
      const id = (metadata as any).id || (metadata as any).item_id || (metadata as any).tmdb_id || (metadata as any).mbid || (metadata as any).value;

      if (catalog_type === 'movie' || catalog_type === 'music' || catalog_type === 'book') {
        if (!(metadata as any).id && !(metadata as any).item_id && !(metadata as any).tmdb_id && !(metadata as any).mbid) {
          setSelectedItem({ ...metadata, catalog_type });
          return;
        }
      } else {
        setSelectedItem({ ...metadata, catalog_type });
        return;
      }

      switch (catalog_type) {
        case 'movie':
          if (metadata.type === 'movie') details = await getMovieDetails(id);
          else if (metadata.type === 'series') details = await getTVShowDetails(id);
          else if (metadata.type === 'actor') details = await getPersonDetails(id);
          break;
        case 'music':
          if (metadata.type === 'artist') details = await getArtistDetails(id);
          else if (metadata.type === 'album') details = await getAlbumDetails(id);
          else if (metadata.type === 'song') details = await getSongDetails(id);
          break;
        case 'book':
          if (metadata.type === 'author') details = await getAuthorDetails(id);
          else if (metadata.type === 'book') details = await getBookDetails(id);
          break;
        default:
          details = { ...metadata };
      }

      setSelectedItem(details ? { ...details, catalog_type, type: metadata.type, metadata } : { ...metadata, catalog_type });
    } catch (error) {
      console.error('Error fetching item details:', error);
      setSelectedItem({ ...post.metadata, catalog_type: post.catalog_type, metadata: post.metadata });
    } finally {
      setDetailLoading(false);
    }
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const name = selectedItem.title || selectedItem.name || selectedItem.value || selectedItem.metadata?.value;
    const image = selectedItem.poster_path 
      ? (selectedItem.poster_path.startsWith('http') ? selectedItem.poster_path : `https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`)
      : selectedItem.profile_path
      ? (selectedItem.profile_path.startsWith('http') ? selectedItem.profile_path : `https://image.tmdb.org/t/p/w500${selectedItem.profile_path}`)
      : selectedItem.image || selectedItem.cover_medium || selectedItem.avatar_url || selectedItem.team_logo || selectedItem.league_logo || selectedItem.metadata?.image || selectedItem.metadata?.poster_path || selectedItem.metadata?.profile_path || selectedItem.metadata?.cover_medium || selectedItem.metadata?.team_logo || selectedItem.metadata?.league_logo;
    
    let imageUrl = image;
    if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
        imageUrl = `https://image.tmdb.org/t/p/w500${imageUrl}`;
    }

    const description = selectedItem.overview || 
                        selectedItem.biography || 
                        selectedItem.description || 
                        selectedItem.summary || 
                        selectedItem.metadata?.overview || 
                        selectedItem.metadata?.biography;

    return (
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedItem(null)}
        >
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={{ flex: 1 }}>{name}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView bounces={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 40 }}>
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" />
              )}

              <View style={styles.modalBody}>
                {selectedItem.tagline ? (
                  <ThemedText style={styles.tagline}>{selectedItem.tagline}</ThemedText>
                ) : null}

                {description ? (
                  <ThemedText style={styles.description}>{description}</ThemedText>
                ) : (
                  <View style={{ gap: Spacing.two }}>
                    <ThemedText style={styles.noInfo}>No detailed description found in API.</ThemedText>
                    {selectedItem.rating && (
                       <ThemedText style={{ textAlign: 'center' }}>
                         My Rating: {typeof selectedItem.rating === 'object' ? 'Rated' : selectedItem.rating}
                       </ThemedText>
                    )}
                  </View>
                )}

                {/* Additional Info Grid */}
                <View style={styles.infoGrid}>
                  {selectedItem.release_date || selectedItem.first_air_date ? (
                    <View style={styles.infoItem}>
                      <ThemedText style={styles.infoLabel}>Released</ThemedText>
                      <ThemedText>{selectedItem.release_date || selectedItem.first_air_date}</ThemedText>
                    </View>
                  ) : null}
                  {selectedItem.vote_average || selectedItem.metadata?.rating ? (
                    <View style={styles.infoItem}>
                      <ThemedText style={styles.infoLabel}>Rating</ThemedText>
                      <ThemedText>
                        {selectedItem.vote_average 
                          ? `${selectedItem.vote_average.toFixed(1)} / 10` 
                          : (typeof selectedItem.metadata.rating === 'object' ? 'User Rated' : selectedItem.metadata.rating)}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    );
  };

  const navigateToComments = (postId: string) => {
    router.push(`/comments?postId=${postId}`);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const timeAgo = new Date(item.created_at).toLocaleDateString();
    
    // Get image from various possible metadata fields
    let itemImage = item.metadata.poster_path 
      ? (item.metadata.poster_path.startsWith('http') ? item.metadata.poster_path : `https://image.tmdb.org/t/p/w500${item.metadata.poster_path}`)
      : item.metadata.profile_path
      ? (item.metadata.profile_path.startsWith('http') ? item.metadata.profile_path : `https://image.tmdb.org/t/p/w500${item.metadata.profile_path}`)
      : item.metadata.image || item.metadata.avatar_url || item.metadata.cover_medium || item.metadata.team_logo || item.metadata.league_logo;

    // Ensure itemImage is a full URL if it's a TMDB path that somehow missed the check
    if (itemImage && typeof itemImage === 'string' && !itemImage.startsWith('http') && (itemImage.startsWith('/') || itemImage.length > 20)) {
        // Fallback for some IDs or paths that might be missing the base URL
        if (item.catalog_type === 'movie' || item.catalog_type === 'series' || (item.metadata.type === 'movie' || item.metadata.type === 'tv')) {
            itemImage = `https://image.tmdb.org/t/p/w500${itemImage.startsWith('/') ? '' : '/'}${itemImage}`;
        }
    }

    const catalogLabel = item.catalog_type.charAt(0).toUpperCase() + item.catalog_type.slice(1);
    const typeLabel = item.metadata.type ? item.metadata.type.charAt(0).toUpperCase() + item.metadata.type.slice(1) : '';

    return (
      <ThemedView style={styles.postCard}>
        {/* Post Header */}
        <TouchableOpacity style={styles.postHeader} onPress={() => navigateToProfile(item.user_id)}>
          <View style={styles.avatarPlaceholder}>
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle" size={40} color={theme.textSecondary} />
            )}
          </View>
          <View style={styles.headerText}>
            <ThemedText type="defaultSemiBold">{item.profiles?.username || 'Unknown User'}</ThemedText>
            <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>{timeAgo}</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Post Content */}
        <View style={styles.postContentContainer}>
          <View style={styles.postTextContent}>
            <ThemedText>
              Added <ThemedText 
                type="defaultSemiBold" 
                style={{ color: theme.brand }}
                onPress={() => showItemDetails(item)}
              >
                {item.metadata.value}
              </ThemedText> to
            </ThemedText>
            <TouchableOpacity onPress={() => navigateToDetails(item)} style={styles.catalogBadgeRow}>
              <View style={[styles.catalogBadge, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={styles.catalogBadgeText}>{catalogLabel}</ThemedText>
              </View>
              {typeLabel ? (
                <>
                  <Ionicons name="chevron-forward" size={12} color={theme.textSecondary} style={{ marginHorizontal: 4 }} />
                  <View style={[styles.catalogBadge, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={styles.catalogBadgeText}>{typeLabel}s</ThemedText>
                  </View>
                </>
              ) : null}
            </TouchableOpacity>
            
            {item.metadata.category && (
              <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]}>
                {item.metadata.category}
              </ThemedText>
            )}
          </View>

          <Pressable onPress={() => showItemDetails(item)}>
            {itemImage && (
              <Image source={{ uri: itemImage }} style={styles.itemImage} resizeMode="cover" />
            )}
          </Pressable>
        </View>

        {/* Social Buttons */}
        <View style={[styles.actionButtons, { borderTopColor: theme.backgroundElement }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item)}>
            <Ionicons 
              name={item.user_has_liked ? "heart" : "heart-outline"} 
              size={22} 
              color={item.user_has_liked ? theme.brand : theme.textSecondary} 
            />
            <ThemedText style={[styles.actionText, { color: item.user_has_liked ? theme.brand : theme.textSecondary }]}>
              {item.likes_count > 0 ? item.likes_count : 'Like'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigateToComments(item.id)}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
              {item.comments_count > 0 ? item.comments_count : 'Comment'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
            <Ionicons name="share-outline" size={22} color={theme.textSecondary} />
            <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>Share</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };


  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <ThemedText type="title">Feed</ThemedText>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
              No posts from people you follow yet.{"\n"}Follow more people to see their updates!
            </ThemedText>
            <TouchableOpacity 
              onPress={() => router.push('/search')}
              style={{ marginTop: Spacing.three, padding: Spacing.two, backgroundColor: theme.brand, borderRadius: 8 }}
            >
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Find People to Follow</ThemedText>
            </TouchableOpacity>
          </View>
        }
      />
      {renderDetailModal()}
      {detailLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: 60,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: Spacing.three,
  },
  postCard: {
    marginBottom: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: 'rgba(150, 150, 150, 0.05)', // Subtle background if ThemedView is transparent
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.two,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
  },
  postContentContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTextContent: {
    flex: 1,
    marginRight: Spacing.two,
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  catalogBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  catalogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catalogBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 12,
    marginTop: Spacing.one,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  actionText: {
    marginLeft: Spacing.one,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? Spacing.four : 0,
    paddingTop: Platform.OS === 'web' ? Spacing.four : 40,
  },
  modalContent: {
    width: '100%',
    height: Platform.OS === 'web' ? 'auto' : '100%',
    maxHeight: Platform.OS === 'web' ? '80%' : '100%',
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  modalBody: {
    padding: Spacing.three,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: Spacing.two,
    textAlign: 'center',
    opacity: 0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  noInfo: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.5,
    marginVertical: Spacing.four,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    paddingTop: Spacing.two,
  },
  infoItem: {
    width: '50%',
    marginBottom: Spacing.two,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.6,
    marginBottom: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
