import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { BADGES, BADGE_STORAGE_KEY } from '../selectbadge';
import { UserBadge } from '@/components/user-badge';
import { ProfileThemeBackground } from '@/components/profile-theme-background';
import { getProfileTheme } from '@/constants/profile-themes';

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
  profile_badge?: string | null;
  selected_theme?: string | null;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [giftCount, setGiftCount] = useState(0);
  const [localTheme, setLocalTheme] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user-profile-theme').then((val) => {
      if (val) setLocalTheme(val);
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      // Avoid synchronous setState in effect by ensuring we don't call it if already loading
      // Actually, setLoading(true) is fine if it's not the FIRST render of the effect but it's easier to just call it.
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // If profile doesn't exist yet, we don't throw, just set null
          if (error.code === 'PGRST116') {
            setProfile(null);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
          if (data?.selected_theme) {
            setLocalTheme(data.selected_theme);
          }
        }

        // Fetch gift count
        const { count: gCount } = await supabase
          .from('gifts')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id);
        setGiftCount(gCount || 0);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleSignOut = async () => {
    const performSignOut = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          if (Platform.OS === 'web') {
            window.alert('Error: ' + error.message);
          } else {
            Alert.alert('Error', error.message);
          }
        }
        router.replace('/signin');
      } catch (err: any) {
        console.error('Sign out failed:', err);
        router.replace('/signin');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        performSignOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: performSignOut
          },
        ]
      );
    }
  };


  const activeThemeId = profile?.selected_theme || localTheme;
  const profileTheme = getProfileTheme(activeThemeId);
  const cardBg = profileTheme ? profileTheme.cardBg : theme.backgroundElement;
  const cardBorder = profileTheme ? profileTheme.cardBorder : 'transparent';
  const cardBorderWidth = profileTheme ? 1 : 0;

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ProfileThemeBackground themeId={activeThemeId} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}>{profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={profileTheme ? profileTheme.textColor : theme.textSecondary} />
                )}</View>
              <View style={styles.nameContainer}>
                <View style={styles.usernameRow}>
                  <ThemedText type="defaultSemiBold" style={[styles.username, profileTheme && { color: profileTheme.textColor }]} numberOfLines={1}>{profile?.full_name || profile?.username}</ThemedText>
                  <UserBadge badgeId={profile?.profile_badge} size={Platform.OS === 'web' ? 32 : 28} />
                </View>
                {profile?.full_name ? <ThemedText style={[styles.handle, profileTheme && { color: profileTheme.textSecondaryColor }]} numberOfLines={1}>@{profile.username}</ThemedText> : null}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, flex: 1 }]}
              activeOpacity={0.7}
              onPress={() => router.push('/editprofile')}
            >
              <ThemedText style={[styles.editButtonText, profileTheme && { color: profileTheme.textColor }]}>Edit Profile</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: profileTheme ? profileTheme.primaryColor : theme.brand, flex: 1, marginLeft: Spacing.two }]}
              activeOpacity={0.7}
              onPress={() => router.push('/findsoulmate')}
            >
              <ThemedText style={[styles.editButtonText, { color: profileTheme ? '#000' : '#fff' }]}>Find Soulmate</ThemedText>
            </TouchableOpacity>
          </View>

          {profile?.bio ? (
            <View style={[styles.bioContainer, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: Spacing.three, borderRadius: 14 }]}>
              <ThemedText style={[styles.bioText, profileTheme && { color: profileTheme.textColor }]}>{profile.bio}</ThemedText>
            </View>
          ) : null}

          {profile?.interests && profile.interests.length > 0 ? (
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest) => (
                <View 
                  key={interest} 
                  style={[styles.interestChip, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                >
                  <Ionicons 
                    name={interestIcons[interest] || 'star'} 
                    size={14} 
                    color={profileTheme ? profileTheme.primaryColor : theme.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText style={[styles.interestText, profileTheme && { color: profileTheme.textColor }]}>{interest}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.socialContainer}>{profile?.instagram_url ? (
              <TouchableOpacity style={[styles.socialIcon, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: 8, borderRadius: 20 }]} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={24} color={profileTheme ? profileTheme.textColor : theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.facebook_url ? (
              <TouchableOpacity style={[styles.socialIcon, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: 8, borderRadius: 20 }]} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={24} color={profileTheme ? profileTheme.textColor : theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.x_url ? (
              <TouchableOpacity style={[styles.socialIcon, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: 8, borderRadius: 20 }]} activeOpacity={0.7}>
                <Ionicons name="logo-twitter" size={24} color={profileTheme ? profileTheme.textColor : theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.pinterest_url ? (
              <TouchableOpacity style={[styles.socialIcon, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: 8, borderRadius: 20 }]} activeOpacity={0.7}>
                <Ionicons name="logo-pinterest" size={24} color={profileTheme ? profileTheme.textColor : theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.snapchat_url ? (
              <TouchableOpacity style={[styles.socialIcon, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, padding: 8, borderRadius: 20 }]} activeOpacity={0.7}>
                <Ionicons name="logo-snapchat" size={24} color={profileTheme ? profileTheme.textColor : theme.text} />
              </TouchableOpacity>
            ) : null}</View>

          <View style={[styles.statsContainer, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, borderRadius: 16 }]}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/profile/gifts')}
            >
              <ThemedText type="defaultSemiBold" style={profileTheme && { color: profileTheme.textColor }}>{giftCount}</ThemedText>
              <ThemedText style={[styles.statLabel, profileTheme && { color: profileTheme.textSecondaryColor }]}>Gifts</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => profile && router.push({ pathname: '/following', params: { userId: profile.id } })}
            >
              <ThemedText type="defaultSemiBold" style={profileTheme && { color: profileTheme.textColor }}>{profile?.following_count || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, profileTheme && { color: profileTheme.textSecondaryColor }]}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => profile && router.push({ pathname: '/followers', params: { userId: profile.id } })}
            >
              <ThemedText type="defaultSemiBold" style={profileTheme && { color: profileTheme.textColor }}>{profile?.follower_count || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, profileTheme && { color: profileTheme.textSecondaryColor }]}>Followers</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, profileTheme && { color: profileTheme.textColor }]}>My Collections</ThemedText>
            <View style={styles.collectionsGrid}>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/moviecollections')}
              >
                <Ionicons name="film" size={24} color={profileTheme ? profileTheme.primaryColor : theme.brand} />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Movies</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/musiccollections')}
              >
                <Ionicons name="musical-notes" size={24} color="#4CD964" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Music</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/bookcollections')}
              >
                <Ionicons name="book" size={24} color="#5856D6" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Books</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/sportscollections')}
              >
                <Ionicons name="trophy" size={24} color="#FF9500" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Sports</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/vehiclecollections')}
              >
                <Ionicons name="car" size={24} color="#5856D6" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Vehicles</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/gamescollections')}
              >
                <Ionicons name="game-controller" size={24} color="#4CD964" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Games</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/foodcollections')}
              >
                <Ionicons name="restaurant" size={24} color="#FF2D55" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Food</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth }]}
                activeOpacity={0.7}
                onPress={() => router.push('/placescollections')}
              >
                <Ionicons name="map" size={24} color="#5AC8FA" />
                <ThemedText style={[styles.collectionName, profileTheme && { color: profileTheme.textColor }]}>Places</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, profileTheme && { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: cardBorderWidth, borderRadius: 16, paddingHorizontal: Spacing.three }]}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: profileTheme ? cardBorder : theme.backgroundSelected }]}
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={22} color={profileTheme ? profileTheme.textColor : theme.text} />
              <ThemedText style={[styles.menuItemText, profileTheme && { color: profileTheme.textColor }]}>Settings</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={profileTheme ? profileTheme.textSecondaryColor : theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color={theme.brand} />
              <ThemedText style={[styles.menuItemText, { color: theme.brand }]}>Sign Out</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={profileTheme ? profileTheme.textSecondaryColor : theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProfileThemeBackground>
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
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
    gap: Spacing.one,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  badgeIcon: {
    marginLeft: 4,
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
  editButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
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
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.three,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  collectionCard: {
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  menuItemText: {
    flex: 1,
    marginLeft: Spacing.three,
    fontSize: 16,
    fontWeight: '600',
  },
});
