import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, ActivityIndicator, Alert, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing, MaxContentWidth } from '@/constants/theme';

interface BlockedUser {
  id: string;
  blocked_id: string;
  profiles: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export default function BlockedAccountsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('blocks')
        .select(`
          id,
          blocked_id,
          profiles:profiles!blocked_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;
      
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        blocked_id: item.blocked_id,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));

      setBlockedUsers(mappedData);
    } catch (error: any) {
      console.error('Error fetching blocked users:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const handleUnblock = async (blockedId: string, username: string) => {
    const performUnblock = async () => {
      try {
        setUnblockingId(blockedId);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', blockedId);

        if (error) throw error;
        
        setBlockedUsers(prev => prev.filter(item => item.blocked_id !== blockedId));
      } catch (error: any) {
        Alert.alert('Error', 'Failed to unblock user: ' + error.message);
      } finally {
        setUnblockingId(null);
      }
    };

    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: performUnblock }
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { borderBottomColor: theme.backgroundSelected }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
          {item.profiles.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={20} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.userDetails}>
          <ThemedText type="defaultSemiBold">{item.profiles.full_name || item.profiles.username}</ThemedText>
          <ThemedText style={styles.username}>@{item.profiles.username}</ThemedText>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.unblockButton, { borderColor: theme.brand }]} 
        onPress={() => handleUnblock(item.blocked_id, item.profiles.username)}
        disabled={unblockingId === item.blocked_id}
      >
        {unblockingId === item.blocked_id ? (
          <ActivityIndicator size="small" color={theme.brand} />
        ) : (
          <ThemedText style={[styles.unblockButtonText, { color: theme.brand }]}>Unblock</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Blocked Accounts</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="ban-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No blocked accounts</ThemedText>
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
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
    padding: Spacing.eight,
  },
  listContent: {
    padding: Spacing.four,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    opacity: 0.6,
  },
  unblockButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: Spacing.four,
    fontSize: 16,
    opacity: 0.5,
  },
});
