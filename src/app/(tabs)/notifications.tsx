import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment';
  is_read: boolean;
  created_at: string;
  actor_id: string;
  post_id?: string;
  comment_id?: string;
  actor: {
    username: string;
    avatar_url: string | null;
  };
  posts?: {
    catalog_type: string;
    metadata: {
      value: string;
      image?: string;
    };
  };
}

type NotificationTab = 'all' | 'follows' | 'likes' | 'comments';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id (username, avatar_url),
          posts:post_id (catalog_type, metadata)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'follows') query = query.eq('type', 'follow');
      if (activeTab === 'likes') query = query.eq('type', 'like');
      if (activeTab === 'comments') query = query.eq('type', 'comment');

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);

      // Mark unread notifications as read when viewed
      if (data && data.length > 0) {
        const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();

    // Mark notifications as read when viewing the screen
    const markAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
        }
    };
    
    markAsRead();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, () => {
        fetchNotifications(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchNotifications]);

  const handleNotificationPress = (notification: Notification) => {
    if (notification.type === 'follow') {
      router.push(`/user/${notification.actor_id}`);
    } else if (notification.post_id) {
      router.push({
        pathname: '/comments',
        params: { postId: notification.post_id }
      });
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <Ionicons name="person-add" size={20} color="#3b82f6" />;
      case 'like':
        return <Ionicons name="heart" size={20} color="#ef4444" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={20} color="#10b981" />;
      default:
        return null;
    }
  };

  const renderNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.username || 'Someone';
    const postTitle = notification.posts?.metadata?.value;
    const postType = notification.posts?.catalog_type || 'post';
    const postDescription = postTitle ? `"${postTitle}" (${postType})` : postType;
    
    switch (notification.type) {
      case 'follow':
        return (
          <ThemedText>
            <ThemedText style={{ fontWeight: 'bold' }}>{actorName}</ThemedText> followed you
          </ThemedText>
        );
      case 'like':
        return (
          <ThemedText>
            <ThemedText style={{ fontWeight: 'bold' }}>{actorName}</ThemedText> liked your {postDescription}
          </ThemedText>
        );
      case 'comment':
        return (
          <ThemedText>
            <ThemedText style={{ fontWeight: 'bold' }}>{actorName}</ThemedText> commented on your {postDescription}
          </ThemedText>
        );
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        { borderBottomColor: theme.border },
        !item.is_read ? { backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' } : undefined
      ].filter(Boolean) as any}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.actorAvatarContainer}>
        {item.actor?.avatar_url ? (
          <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: theme.border }]}>
            <Ionicons name="person" size={24} color={theme.icon} />
          </View>
        )}
        <View style={styles.iconBadge}>
          {renderNotificationIcon(item.type)}
        </View>
      </View>

      <View style={styles.notificationContent}>
        {renderNotificationText(item)}
        <ThemedText style={styles.timeText}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </ThemedText>
      </View>

      {item.posts?.metadata?.image && (
        <Image source={{ uri: item.posts.metadata.image }} style={styles.postThumbnail} />
      )}
    </TouchableOpacity>
  );

  const tabs: { id: NotificationTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'follows', label: 'Follows' },
    { id: 'likes', label: 'Likes' },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Notifications</ThemedText>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.tab,
              activeTab === tab.id ? { borderBottomColor: theme.tint, borderBottomWidth: 2 } : undefined
            ].filter(Boolean) as any}
          >
            <ThemedText 
              style={[
                styles.tabLabel, 
                activeTab === tab.id ? { color: theme.tint, fontWeight: 'bold' } : undefined
              ].filter(Boolean) as any}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.tint]} tintColor={theme.tint} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
            </View>
          }
          contentContainerStyle={(notifications.length === 0 ? { flex: 1 } : undefined) as any}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.two,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  tabLabel: {
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.four,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  actorAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  postThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginLeft: Spacing.two,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.eight,
  },
  emptyText: {
    opacity: 0.5,
    textAlign: 'center',
  },
});
