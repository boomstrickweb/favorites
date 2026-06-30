import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { decryptMessage } from '@/lib/crypto';
import { Spacing, MaxContentWidth } from '@/constants/theme';

interface ChatItem {
  id: string;
  last_message_at: string;
  other_participant: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    message_type: 'text' | 'image' | 'voice';
    is_read: boolean;
  };
  unread_count: number;
}

export default function MessageListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get all chats the user is part of
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (participantsError) throw participantsError;
      if (!participantsData || participantsData.length === 0) {
        setChats([]);
        return;
      }

      const chatIds = participantsData.map(p => p.chat_id);

      // Fetch blocked user IDs to filter them out
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      
      const blockedUserIds = blocks ? blocks.map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id) : [];

      // 2. Fetch chat details, other participants, and last message
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          last_message_at,
          encryption_key_salt,
          chat_participants!inner (
            user_id,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          ),
          messages (
            content,
            created_at,
            sender_id,
            message_type,
            is_read
          )
        `)
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) throw chatsError;

      const formattedChats: ChatItem[] = chatsData
        .filter((chat: any) => {
          const otherParticipantId = chat.chat_participants.find((p: any) => p.user_id !== user.id)?.user_id;
          return !blockedUserIds.includes(otherParticipantId);
        })
        .map((chat: any) => {
          const otherParticipant = chat.chat_participants.find((p: any) => p.user_id !== user.id)?.profiles;
        
        // Get the latest message (it's returned as an array, we take the one with latest created_at)
        const sortedMessages = chat.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastMessage = sortedMessages?.[0];
        if (lastMessage) {
          lastMessage.content = decryptMessage(lastMessage.content, chat.encryption_key_salt);
        }

        const unreadCount = chat.messages?.filter((m: any) => m.sender_id !== user.id && !m.is_read).length || 0;

        return {
          id: chat.id,
          last_message_at: chat.last_message_at,
          other_participant: otherParticipant,
          last_message: lastMessage,
          unread_count: unreadCount
        };
      }).filter(chat => chat.other_participant);

      setChats(formattedChats);
    } catch (error: any) {
      console.error('Error fetching chats:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    
    // Subscribe to changes in messages and chats to refresh the list
    const channel = supabase
      .channel('public:chat_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchChats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: theme.backgroundElement }]}
      onPress={() => router.push({ pathname: '/chatscreen', params: { chatId: item.id, otherUserId: item.other_participant.id } })}
    >
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        {item.other_participant.avatar_url ? (
          <Image source={{ uri: item.other_participant.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={24} color={theme.textSecondary} />
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
            {item.other_participant.full_name || item.other_participant.username}
          </ThemedText>
          <ThemedText style={styles.time}>
            {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
        <View style={styles.chatFooter}>
          <ThemedText numberOfLines={1} style={[styles.lastMessage, (item.unread_count > 0 ? { color: theme.text, fontWeight: '500' } : undefined)].filter(Boolean) as any}>
            {item.last_message ? (
              item.last_message.message_type === 'image' ? '📷 Image' :
              item.last_message.message_type === 'voice' ? '🎤 Voice message' :
              item.last_message.content
            ) : 'No messages yet'}
          </ThemedText>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.brand }]}>
              <ThemedText style={styles.unreadCount}>{item.unread_count}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">Messages</ThemedText>
      </View>

      {loading && chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  chatCard: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 16,
    marginBottom: Spacing.two,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: Spacing.three,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginLeft: Spacing.two,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.two,
  },
  unreadCount: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: Spacing.three,
    fontSize: 16,
    color: '#888',
  },
});
