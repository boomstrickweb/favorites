import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserBadge } from '@/components/user-badge';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { BADGES } from './selectbadge';

interface Visitor {
  id: string;
  created_at: string;
  viewer: {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
    profile_badge?: string | null;
  };
}

export default function ProfileVisitorsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisitors = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          id,
          created_at,
          viewer:viewer_id (id, username, avatar_url, full_name, profile_badge)
        `)
        .eq('viewed_id', user.id)
        .eq('is_stalk_mode', false) // Professional: Hide stalkers
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitors((data as any) || []);
    } catch (error) {
      console.error('Error fetching profile visitors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/premiumprivileges');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVisitors();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderVisitor = ({ item }: { item: Visitor }) => {
    return (
      <TouchableOpacity 
        style={[styles.visitorItem, { borderBottomColor: theme.backgroundElement }]}
        onPress={() => router.push(`/user/${item.viewer.id}`)}
      >
        <View style={styles.visitorInfo}>
          {item.viewer.avatar_url ? (
            <Image source={{ uri: item.viewer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="person" size={24} color={theme.textSecondary} />
            </View>
          )}
          <View style={styles.textContainer}>
            <View style={styles.usernameRow}>
              <ThemedText type="defaultSemiBold">{item.viewer.full_name || item.viewer.username}</ThemedText>
              <UserBadge badgeId={item.viewer.profile_badge} size={20} style={styles.badgeIcon} />
            </View>
            <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatDate(item.created_at)}
            </ThemedText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Profile Visitors</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            data={visitors}
            renderItem={renderVisitor}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="eye-off-outline" size={64} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No visitors yet.
                </ThemedText>
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
  },
  visitorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  visitorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.three,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
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
  },
});
