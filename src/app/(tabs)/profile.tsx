import { useState, useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert, Image, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

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
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        }
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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


  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>{profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={theme.textSecondary} />
                )}</View>
              <View style={styles.nameContainer}>
                <ThemedText type="defaultSemiBold" style={styles.username} numberOfLines={1}>{profile?.full_name || profile?.username}</ThemedText>
                {profile?.full_name ? <ThemedText style={styles.handle} numberOfLines={1}>@{profile.username}</ThemedText> : null}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.backgroundElement, flex: 1 }]}
              activeOpacity={0.7}
              onPress={() => router.push('/editprofile')}
            >
              <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.brand, flex: 1, marginLeft: Spacing.two }]}
              activeOpacity={0.7}
              onPress={() => router.push('/findsoulmate')}
            >
              <ThemedText style={[styles.editButtonText, { color: '#fff' }]}>Find Soulmate</ThemedText>
            </TouchableOpacity>
          </View>

          {profile?.bio ? <View style={styles.bioContainer}><ThemedText style={styles.bioText}>{profile.bio}</ThemedText></View> : null}

          {profile?.interests && profile.interests.length > 0 ? (
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

          <View style={styles.socialContainer}>{profile?.instagram_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.facebook_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.x_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-twitter" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.pinterest_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-pinterest" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}{profile?.snapchat_url ? (
              <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7}>
                <Ionicons name="logo-snapchat" size={24} color={theme.text} />
              </TouchableOpacity>
            ) : null}</View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold">0</ThemedText>
              <ThemedText style={styles.statLabel}>Favorites</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => profile && router.push({ pathname: '/following', params: { userId: profile.id } })}
            >
              <ThemedText type="defaultSemiBold">{profile?.following_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => profile && router.push({ pathname: '/followers', params: { userId: profile.id } })}
            >
              <ThemedText type="defaultSemiBold">{profile?.follower_count || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Followers</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>My Collections</ThemedText>
            <View style={styles.collectionsGrid}>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/moviecollections')}
              >
                <Ionicons name="film" size={24} color={theme.brand} />
                <ThemedText style={styles.collectionName}>Movies</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/musiccollections')}
              >
                <Ionicons name="musical-notes" size={24} color="#4CD964" />
                <ThemedText style={styles.collectionName}>Music</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/bookcollections')}
              >
                <Ionicons name="book" size={24} color="#5856D6" />
                <ThemedText style={styles.collectionName}>Books</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/sportscollections')}
              >
                <Ionicons name="trophy" size={24} color="#FF9500" />
                <ThemedText style={styles.collectionName}>Sports</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/vehiclecollections')}
              >
                <Ionicons name="car" size={24} color="#5856D6" />
                <ThemedText style={styles.collectionName}>Vehicles</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/gamescollections')}
              >
                <Ionicons name="game-controller" size={24} color="#4CD964" />
                <ThemedText style={styles.collectionName}>Games</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/foodcollections')}
              >
                <Ionicons name="restaurant" size={24} color="#FF2D55" />
                <ThemedText style={styles.collectionName}>Food</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.collectionCard, { backgroundColor: theme.backgroundElement }]}
                activeOpacity={0.7}
                onPress={() => router.push('/placescollections')}
              >
                <Ionicons name="map" size={24} color="#5AC8FA" />
                <ThemedText style={styles.collectionName}>Places</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: theme.backgroundSelected }]}
              activeOpacity={0.7}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={22} color={theme.text} />
              <ThemedText style={styles.menuItemText}>Settings</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color={theme.brand} />
              <ThemedText style={[styles.menuItemText, { color: theme.brand }]}>Sign Out</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
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
