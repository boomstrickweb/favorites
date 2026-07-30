import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { BADGES } from './selectbadge';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  profile_badge?: string | null;
}

export default function PremiumNotificationsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchNotificationEnabledProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('premium_notifications')
        .select(`
          target_id,
          profiles:target_id (id, username, full_name, avatar_url, profile_badge)
        `)
        .eq('subscriber_id', user.id);

      if (error) throw error;

      const profileList = (data || []).map(item => item.profiles).filter(Boolean) as unknown as Profile[];
      setProfiles(profileList);
    } catch (error: any) {
      console.error('Error fetching premium notifications:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationEnabledProfiles();
  }, [fetchNotificationEnabledProfiles]);

  const handleRemove = async (targetId: string) => {
    try {
      setRemovingId(targetId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('premium_notifications')
        .delete()
        .eq('subscriber_id', user.id)
        .eq('target_id', targetId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== targetId));
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }: { item: Profile }) => {
    const badge = item.profile_badge ? BADGES.find(b => b.id === item.profile_badge) : null;
    
    return (
      <TouchableOpacity 
        style={[styles.item, { backgroundColor: theme.backgroundElement }]}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color={theme.textSecondary} />
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.usernameRow}>
              <ThemedText type="defaultSemiBold">{item.full_name || item.username}</ThemedText>
              {badge && (
                <Ionicons 
                  name={badge.icon as any} 
                  size={14} 
                  color={badge.color} 
                  style={styles.badgeIcon} 
                />
              )}
            </View>
            <ThemedText style={styles.handle}>@{item.username}</ThemedText>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemove(item.id)}
          disabled={removingId === item.id}
        >
          {removingId === item.id ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <Ionicons name="notifications-off" size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Premium Notifications</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-outline" size={64} color={theme.textSecondary} />
                <ThemedText style={styles.emptyText}>You haven't enabled notifications for any profiles yet.</ThemedText>
                <ThemedText style={styles.emptySubtext}>You can add up to 5 profiles to see their updates in your feed.</ThemedText>
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
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  backButton: {
    padding: 4,
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 4,
  },
  handle: {
    fontSize: 13,
    opacity: 0.6,
  },
  removeButton: {
    padding: Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.eight,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
