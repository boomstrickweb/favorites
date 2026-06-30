import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
}

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const fetchFollowing = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Check privacy of the user whose following list we are trying to see
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, privacy_followers')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const privacy = profileData.privacy_followers || 'Everyone';
      
      if (userId !== authUser?.id && privacy !== 'Everyone') {
        let isFollowingTarget = false;
        let followsMeBack = false;

        if (authUser) {
          const { data: followingData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', authUser.id)
            .eq('following_id', userId)
            .maybeSingle();
          
          isFollowingTarget = !!followingData;

          const { data: followerData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', userId)
            .eq('following_id', authUser.id)
            .maybeSingle();
          
          followsMeBack = !!followerData;
        }

        if (privacy === 'Only Me' || (privacy === 'Followers you follow back' && (!isFollowingTarget || !followsMeBack))) {
          Alert.alert('Privacy', 'This user has restricted who can see their following list.');
          setUsers([]);
          setLoading(false);
          router.back();
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:following_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      
      let following = data.map((item: any) => item.following).filter(Boolean);

      if (authUser) {
        // Fetch which of these users the current user is following
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', authUser.id)
          .in('following_id', following.map(f => f.id));

        // Fetch which of these users are following the current user
        const { data: followersOfMeData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', authUser.id)
          .in('follower_id', following.map(f => f.id));

        const followingIds = new Set(followingData?.map(f => f.following_id) || []);
        const followerOfMeIds = new Set(followersOfMeData?.map(f => f.follower_id) || []);

        following = following.map(f => ({
          ...f,
          isFollowing: followingIds.has(f.id),
          isFollower: followerOfMeIds.has(f.id)
        }));
      }

      setUsers(following);
    } catch (error: any) {
      console.error('Error fetching following:', error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleFollow = async (profile: UserProfile) => {
    if (!currentUser || profile.id === currentUser.id) return;

    const performFollow = async () => {
      try {
        setActionLoading(profile.id);
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });

        if (error) throw error;
        
        setUsers(prev => prev.map(u => u.id === profile.id ? { ...u, isFollowing: true } : u));
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      } finally {
        setActionLoading(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to follow ${profile.full_name || profile.username}?`);
      if (confirmed) {
        performFollow();
      }
    } else {
      Alert.alert(
        'Follow User',
        `Are you sure you want to follow ${profile.full_name || profile.username}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Follow',
            onPress: performFollow
          }
        ]
      );
    }
  };

  const handleUnfollow = async (profile: UserProfile) => {
    if (!currentUser) return;

    const performUnfollow = async () => {
      try {
        setActionLoading(profile.id);
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);

        if (error) throw error;

        setUsers(prev => prev.map(u => u.id === profile.id ? { ...u, isFollowing: false } : u));
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      } finally {
        setActionLoading(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to unfollow ${profile.full_name || profile.username}?`);
      if (confirmed) {
        performUnfollow();
      }
    } else {
      Alert.alert(
        'Unfollow User',
        `Are you sure you want to unfollow ${profile.full_name || profile.username}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: performUnfollow
          }
        ]
      );
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={[styles.userCard, { backgroundColor: theme.backgroundElement }]}>
      <TouchableOpacity 
        style={styles.userCardInfo}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold">{item.full_name || item.username}</ThemedText>
          {item.full_name ? (
            <ThemedText style={styles.username}>@{item.username}</ThemedText>
          ) : null}
        </View>
      </TouchableOpacity>

      {currentUser && currentUser.id !== item.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.isFollowing ? styles.followingButton : { backgroundColor: theme.brand }
          ]}
          onPress={() => item.isFollowing ? handleUnfollow(item) : handleFollow(item)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color={item.isFollowing ? theme.text : "#FFFFFF"} />
          ) : (
            <ThemedText style={[
              styles.followButtonText,
              item.isFollowing ? { color: theme.text } : { color: "#FFFFFF" }
            ]}>
              {item.isFollowing ? 'Following' : (item.isFollower ? 'Follow Back' : 'Follow')}
            </ThemedText>
          )}
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => router.push(`/user/${item.id}`)} style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold">Following</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                <ThemedText style={styles.emptyText}>Not following anyone yet</ThemedText>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backButton: {
    padding: Spacing.one,
    marginLeft: -Spacing.one,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
  },
  userCardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    paddingLeft: Spacing.one,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: Spacing.three,
    fontSize: 16,
    opacity: 0.5,
  },
});
