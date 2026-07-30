import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { BADGES } from '../selectbadge';

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  x_url?: string;
  pinterest_url?: string;
  snapchat_url?: string;
  interests?: string[];
  follower_count?: number;
  following_count?: number;
  privacy_followers?: string;
  privacy_collections?: string;
  privacy_likes?: string;
  privacy_messages?: string;
  is_premium?: boolean;
  stalk_mode?: boolean;
  profile_badge?: string | null;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserPremium, setIsCurrentUserPremium] = useState(false);
  const [hasNotificationsEnabled, setHasNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);

  const checkBlockStatus = useCallback(async (targetId: string, currentUserId: string) => {
    try {
      // Check if current user blocked target user
      const { data: blockData, error: blockError } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetId)
        .maybeSingle();

      if (blockError) throw blockError;
      setIsBlocked(!!blockData);

      // Check if target user blocked current user
      const { data: blockedByData, error: blockedByError } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', targetId)
        .eq('blocked_id', currentUserId)
        .maybeSingle();

      if (blockedByError) throw blockedByError;
      setBlockedMe(!!blockedByData);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  }, []);

  const checkPremiumNotificationStatus = useCallback(async (targetId: string, currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('premium_notifications')
        .select('*')
        .eq('subscriber_id', currentUserId)
        .eq('target_id', targetId)
        .maybeSingle();

      if (error) throw error;
      setHasNotificationsEnabled(!!data);
    } catch (error) {
      console.error('Error checking premium notification status:', error);
    }
  }, []);

  const checkFollowStatus = useCallback(async (targetId: string, currentUserId: string) => {
    try {
      // Check if current user follows target user
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId)
        .maybeSingle();

      if (followingError) throw followingError;
      setIsFollowing(!!followingData);

      // Check if target user follows current user (for "Followers you follow back" logic)
      const { data: followerData, error: followerError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', targetId)
        .eq('following_id', currentUserId)
        .maybeSingle();

      if (followerError) throw followerError;
      setFollowsMe(!!followerData);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, []);

  const recordView = useCallback(async (targetId: string, currentUserId: string, isPremium: boolean) => {
    if (viewRecorded || targetId === currentUserId || !isPremium) return;
    
    try {
      // Fetch viewer's stalk mode status
      const { data: viewerProfile } = await supabase
        .from('profiles')
        .select('stalk_mode')
        .eq('id', currentUserId)
        .single();
      
      const stalkMode = !!viewerProfile?.stalk_mode;

      // Use the RPC function to record view (handles 24h limit and stalk limit)
      const { error } = await supabase.rpc('record_profile_view', {
        p_viewer_id: currentUserId,
        p_viewed_id: targetId,
        p_is_stalk_mode: stalkMode
      });

      if (error) {
        // If it's a stalking limit error, we might want to log it or ignore
        console.warn('Profile view record error:', error.message);
      } else {
        setViewRecorded(true);
      }
    } catch (error) {
      console.error('Error recording profile view:', error);
    }
  }, [viewRecorded]);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
        
        setIsCurrentUserPremium(!!currentUserProfile?.is_premium);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      setProfile(data);

      if (user && id !== user.id) {
        const profileIsPremium = !!data.is_premium;
        await Promise.all([
          checkFollowStatus(id as string, user.id),
          checkBlockStatus(id as string, user.id),
          checkPremiumNotificationStatus(id as string, user.id),
          recordView(id as string, user.id, profileIsPremium)
        ]);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [id, checkFollowStatus]);

  const handleFollow = async () => {
    if (!currentUser || !profile || id === currentUser.id) return;

    const performFollow = async () => {
      try {
        setFollowLoading(true);
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });

        if (error) throw error;
        
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, follower_count: (prev.follower_count || 0) + 1 } : null);
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      } finally {
        setFollowLoading(false);
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

  const handleUnfollow = async () => {
    if (!currentUser || !profile) return;

    const performUnfollow = async () => {
      try {
        setFollowLoading(true);
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);

        if (error) throw error;

        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, follower_count: Math.max(0, (prev.follower_count || 0) - 1) } : null);
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      } finally {
        setFollowLoading(false);
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
    fetchProfile();
  }, [fetchProfile]);

  const handleBlockUser = async () => {
    if (!currentUser || !profile || id === currentUser.id) return;

    const performBlock = async () => {
      try {
        setBlockLoading(true);
        // If we block someone, we should also unfollow them
        if (isFollowing) {
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id);
          setIsFollowing(false);
          setProfile(prev => prev ? { ...prev, follower_count: Math.max(0, (prev.follower_count || 0) - 1) } : null);
        }

        const { error } = await supabase
          .from('blocks')
          .insert({
            blocker_id: currentUser.id,
            blocked_id: profile.id
          });

        if (error) throw error;
        setIsBlocked(true);
        
        if (Platform.OS === 'web') {
          window.alert('User blocked successfully');
        } else {
          Alert.alert('Success', 'User blocked successfully');
        }
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      } finally {
        setBlockLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to block ${profile.full_name || profile.username}? They won't be able to see your profile or interact with you.`);
      if (confirmed) {
        performBlock();
      }
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${profile.full_name || profile.username}? They won't be able to see your profile or interact with you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: performBlock
          }
        ]
      );
    }
  };

  const handleUnblockUser = async () => {
    if (!currentUser || !profile) return;

    try {
      setBlockLoading(true);
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', profile.id);

      if (error) throw error;
      setIsBlocked(false);
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const handleToggleNotification = async () => {
    if (!currentUser || !profile || !isCurrentUserPremium) return;

    try {
      setNotificationLoading(true);
      if (hasNotificationsEnabled) {
        // Disable
        const { error } = await supabase
          .from('premium_notifications')
          .delete()
          .eq('subscriber_id', currentUser.id)
          .eq('target_id', profile.id);

        if (error) throw error;
        setHasNotificationsEnabled(false);
      } else {
        // Enable
        const { error } = await supabase
          .from('premium_notifications')
          .insert({
            subscriber_id: currentUser.id,
            target_id: profile.id
          });

        if (error) {
          if (error.message.includes('up to 5 profiles')) {
             if (Platform.OS === 'web') {
              window.alert('Limit reached: You can only enable notifications for up to 5 profiles.');
            } else {
              Alert.alert('Limit Reached', 'You can only enable notifications for up to 5 profiles.');
            }
            return;
          }
          throw error;
        }
        setHasNotificationsEnabled(true);
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setNotificationLoading(false);
    }
  };

  const interestIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Arts & Crafts': 'brush',
    'Collecting': 'archive',
    'Gaming & Tech': 'game-controller',
    'Outdoor & Adventure': 'leaf',
    'Sports & Fitness': 'fitness',
    'Music & Performance': 'musical-notes',
    'Food & Drink': 'restaurant',
    'Domestic & Lifestyle': 'home',
    'Literature & Mental Fitness': 'book'
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  if (!profile || blockedMe) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>{blockedMe ? 'This account is private or unavailable' : 'User not found'}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: theme.brand }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.navHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold">Profile</ThemedText>
            <View style={styles.headerActions}>
              {isCurrentUserPremium && currentUser && currentUser.id !== profile.id && !isFollowing && (
                <TouchableOpacity 
                  onPress={handleToggleNotification}
                  style={styles.headerButton}
                  disabled={notificationLoading}
                >
                  {notificationLoading ? (
                    <ActivityIndicator size="small" color={theme.brand} />
                  ) : (
                    <Ionicons 
                      name={hasNotificationsEnabled ? "notifications" : "notifications-outline"} 
                      size={24} 
                      color={hasNotificationsEnabled ? theme.brand : theme.text} 
                    />
                  )}
                </TouchableOpacity>
              )}
              {currentUser && currentUser.id !== profile.id ? (
                <TouchableOpacity 
                  onPress={isBlocked ? handleUnblockUser : handleBlockUser} 
                  style={styles.headerButton}
                  disabled={blockLoading}
                >
                  {blockLoading ? (
                    <ActivityIndicator size="small" color={isBlocked ? theme.brand : "#FF3B30"} />
                  ) : (
                    <Ionicons 
                      name={isBlocked ? "lock-open-outline" : "ban-outline"} 
                      size={22} 
                      color={isBlocked ? theme.brand : "#FF3B30"} 
                    />
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>
          </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={theme.textSecondary} />
                )}
              </View>
              <View style={styles.nameContainer}>
                <View style={styles.usernameRow}>
                  <ThemedText type="defaultSemiBold" style={styles.username}>
                    {profile.full_name || profile.username}
                  </ThemedText>
                  {profile.profile_badge && (
                    <Ionicons 
                      name={BADGES.find(b => b.id === profile.profile_badge)?.icon as any || 'star-outline'} 
                      size={18} 
                      color={BADGES.find(b => b.id === profile.profile_badge)?.color || theme.brand} 
                      style={styles.badgeIcon} 
                    />
                  )}
                </View>
                {profile.full_name ? (
                  <ThemedText style={styles.handle}>@{profile.username}</ThemedText>
                ) : null}
              </View>
            </View>
          </View>

          {profile.bio ? (
            <View style={styles.bioContainer}>
              <ThemedText style={styles.bioText}>{profile.bio}</ThemedText>
            </View>
          ) : null}

          {profile.interests && profile.interests.length > 0 ? (
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest) => (
                <View 
                  key={interest} 
                  style={[styles.interestChip, { backgroundColor: theme.backgroundElement }]}
                >
                  <Ionicons 
                    name={interestIcons[interest] || 'star'} 
                    size={14} 
                    color={theme.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText style={styles.interestText}>{interest}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.socialContainer}>
            {profile.instagram_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}
            {profile.facebook_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}
            {profile.x_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-twitter" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}
            {profile.pinterest_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-pinterest" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}
            {profile.snapchat_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-snapchat" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold">0</ThemedText>
              <ThemedText style={styles.statLabel}>Favorites</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                const canSeeFollowers = !profile.privacy_followers || 
                                        profile.privacy_followers === 'Everyone' || 
                                        (profile.privacy_followers === 'Followers you follow back' && isFollowing && followsMe);
                
                if (canSeeFollowers || profile.id === currentUser?.id) {
                  router.push({ pathname: '/following', params: { userId: profile.id } });
                } else {
                  Alert.alert('Privacy', 'This user has restricted who can see their following list.');
                }
              }}
            >
              <ThemedText type="defaultSemiBold">
                {(!profile.privacy_followers || profile.privacy_followers === 'Everyone' || (profile.privacy_followers === 'Followers you follow back' && isFollowing && followsMe) || profile.id === currentUser?.id) 
                  ? (profile.following_count || 0) 
                  : '—'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                const canSeeFollowers = !profile.privacy_followers || 
                                        profile.privacy_followers === 'Everyone' || 
                                        (profile.privacy_followers === 'Followers you follow back' && isFollowing && followsMe);
                
                if (canSeeFollowers || profile.id === currentUser?.id) {
                  router.push({ pathname: '/followers', params: { userId: profile.id } });
                } else {
                  Alert.alert('Privacy', 'This user has restricted who can see their followers list.');
                }
              }}
            >
              <ThemedText type="defaultSemiBold">
                {(!profile.privacy_followers || profile.privacy_followers === 'Everyone' || (profile.privacy_followers === 'Followers you follow back' && isFollowing && followsMe) || profile.id === currentUser?.id) 
                  ? (profile.follower_count || 0) 
                  : '—'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Followers</ThemedText>
            </TouchableOpacity>
          </View>

          {currentUser && currentUser.id !== profile.id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[
                  styles.followButton, 
                  { backgroundColor: isFollowing ? theme.backgroundElement : theme.brand }
                ]}
                onPress={isFollowing ? handleUnfollow : handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? theme.text : "#fff"} />
                ) : (
                  <ThemedText style={[styles.followButtonText, { color: isFollowing ? theme.text : "#fff" }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </ThemedText>
                )}
              </TouchableOpacity>
              {(!profile.privacy_messages || profile.privacy_messages === 'Everyone' || (profile.privacy_messages === 'Followers you follow back' && isFollowing && followsMe)) && (
                <TouchableOpacity 
                  style={[styles.messageButton, { backgroundColor: theme.backgroundElement }]}
                  onPress={() => router.push({ pathname: '/chatscreen', params: { otherUserId: profile.id } })}
                >
                  <ThemedText style={styles.messageButtonText}>Message</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.compareButton, { backgroundColor: theme.backgroundElement }]}
                onPress={() => router.push({ 
                  pathname: '/compare', 
                  params: { userId: profile.id, userName: profile.full_name || profile.username } 
                })}
              >
                <Ionicons name="swap-horizontal" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Collections</ThemedText>
            {(!profile.privacy_collections || 
               profile.privacy_collections === 'Everyone' || 
               (profile.privacy_collections === 'Your Followers' && isFollowing) ||
               (profile.privacy_collections === 'Followers you follow back' && isFollowing && followsMe) ||
               profile.id === currentUser?.id) ? (
              <View style={styles.collectionsGrid}>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/moviecollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="film" size={24} color={theme.brand} />
                  <ThemedText style={styles.collectionName}>Movies</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/musiccollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="musical-notes" size={24} color="#4CD964" />
                  <ThemedText style={styles.collectionName}>Music</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/bookcollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="book" size={24} color="#5856D6" />
                  <ThemedText style={styles.collectionName}>Books</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/sportscollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="trophy" size={24} color="#FF9500" />
                  <ThemedText style={styles.collectionName}>Sports</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/vehiclecollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="car" size={24} color="#5856D6" />
                  <ThemedText style={styles.collectionName}>Vehicles</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/gamescollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="game-controller" size={24} color="#4CD964" />
                  <ThemedText style={styles.collectionName}>Games</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/foodcollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="restaurant" size={24} color="#FF2D55" />
                  <ThemedText style={styles.collectionName}>Food</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/placescollections', params: { userId: profile.id } })}
                >
                  <Ionicons name="map" size={24} color="#5AC8FA" />
                  <ThemedText style={styles.collectionName}>Places</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ThemedView style={[styles.privacyNotice, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="lock-closed" size={24} color={theme.textSecondary} />
                <ThemedText style={styles.privacyNoticeText}>This user's collections are private.</ThemedText>
              </ThemedView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  navHeader: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 6,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  handle: {
    fontSize: 14,
    opacity: 0.6,
  },
  bioContainer: {
    marginBottom: Spacing.four,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 22,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  socialIcon: {
    opacity: 0.8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
    marginBottom: Spacing.six,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.six,
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  messageButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  compareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
  },
  emptyCollectionsText: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  collectionCard: {
    width: '47%', // Ensuring 2 columns with some gap
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 12,
    gap: Spacing.three,
  },
  privacyNoticeText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
