import { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
// Safe Audio module loading
let AudioModule: any = undefined;

// Safe ImagePicker module loading
let ImagePickerModuleCached: any = undefined;

const getImagePicker = () => {
  if (ImagePickerModuleCached !== undefined) return ImagePickerModuleCached;
  try {
    const IP = require('expo-image-picker');
    ImagePickerModuleCached = IP;
    return ImagePickerModuleCached;
  } catch (e) {
    ImagePickerModuleCached = null;
    return null;
  }
};

// Voice recording and playback are disabled (expo-av removed)
const getAudio = () => {
  return null;
};

const getIsAudioAvailable = () => {
  return false;
};

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { sendPushNotification } from '@/lib/notifications';
import { Spacing, MaxContentWidth } from '@/constants/theme';
// Safe FileSystem module loading
let FileSystemModuleCached: any = undefined;
const getFileSystem = () => {
  if (FileSystemModuleCached !== undefined) return FileSystemModuleCached;
  try {
    const FS = require('expo-file-system');
    FileSystemModuleCached = FS;
    return FileSystemModuleCached;
  } catch (e) {
    FileSystemModuleCached = null;
    return null;
  }
};

export function ErrorBoundary(props: any) {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Chat Error</ThemedText>
      <ThemedText style={{ textAlign: 'center', marginBottom: 20 }}>{props?.error?.message || 'Unknown error'}</ThemedText>
      <TouchableOpacity onPress={props.retry}>
        <ThemedText style={{ color: '#007AFF' }}>Retry</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: 'text' | 'image' | 'voice';
  media_url?: string;
  media_metadata?: {
    duration?: number;
    width?: number;
    height?: number;
  };
}

interface Participant {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export default function ChatScreen() {
  const { chatId: initialChatId, otherUserId } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(initialChatId as string || null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Participant | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatSalt, setChatSalt] = useState<string | null>(null);
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const isAudioAvailableState = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    isAudioAvailableState.current = getIsAudioAvailable();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    if (otherUserId) {
      fetchOtherUser(otherUserId as string);
    }
  }, [otherUserId]);

  const fetchOtherUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setOtherUser(data);
    } catch (error: any) {
      console.error('Error fetching user:', error.message);
    }
  };

  const fetchMessages = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      console.log('[ChatScreen] Fetching messages for chat:', id);
      // Fetch chat details to get the salt
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('encryption_key_salt')
        .eq('id', id)
        .single();
      
      const salt = chatData?.encryption_key_salt || null;
      console.log('[ChatScreen] Loaded salt:', salt, 'type:', typeof salt);
      
      // We must set the salt BEFORE decrypting existing messages
      // to avoid using a stale or null salt from state
      setChatSalt(salt);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log(`[ChatScreen] Decrypting ${data?.length || 0} messages`);
      const decryptedMessages = (data || []).map((msg: Message) => ({
        ...msg,
        content: decryptMessage(msg.content, salt || undefined)
      }));
      console.log(`[ChatScreen] First message decrypted: ${decryptedMessages[0]?.content.substring(0, 10)}...`);
      setMessages(decryptedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
    } finally {
      setLoading(false);
      if (chatId) {
        markMessagesAsRead(chatId);
      }
    }
  }, [chatId]);

  const markMessagesAsRead = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', id)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${chatId}` 
        }, async (payload) => {
          const incoming = payload.new as Message;
          console.log('[ChatScreen] New message via subscription:', incoming.id);
          
          // Use the most up-to-date salt
          let currentSalt = chatSalt;
          if (!currentSalt) {
            const { data } = await supabase.from('chats').select('encryption_key_salt').eq('id', chatId).single();
            currentSalt = data?.encryption_key_salt || null;
            if (currentSalt) setChatSalt(currentSalt);
          }

          const decryptedMessage = {
            ...incoming,
            content: decryptMessage(incoming.content, currentSalt || undefined)
          };
          console.log('[ChatScreen] Decrypted real-time message:', decryptedMessage.content);
          
          if (incoming.sender_id !== currentUser?.id) {
            markMessagesAsRead(chatId);
          }
          
          setMessages((prev) => {
            // Check if message already exists (optimistic update)
            const exists = prev.some(m => m.id === decryptedMessage.id);
            if (exists) {
              // Update the existing message in case it was stuck as encrypted
              return prev.map(m => m.id === decryptedMessage.id ? decryptedMessage : m);
            }
            return [...prev, decryptedMessage];
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
        setLoading(false);
    }
  }, [chatId, fetchMessages, chatSalt]);

  const handleSendMessage = async (
    type: 'text' | 'image' | 'voice' = 'text',
    mediaUrl?: string,
    metadata?: any
  ) => {
    if (type === 'text' && (!newMessage.trim() || !currentUser || sending)) return;
    if ((type === 'image' || type === 'voice') && !mediaUrl) return;

    try {
      setSending(true);
      let activeChatId = chatId;

      // 1. If no chatId, create a new chat and add participants
      if (!activeChatId && otherUserId) {
        // First check if a chat already exists between these two
        const { data: existingChat, error: checkError } = await supabase
          .rpc('get_existing_chat', { p_user_id: otherUserId });
        
        if (existingChat && existingChat.length > 0) {
            activeChatId = existingChat[0].chat_id;
            setChatId(activeChatId);
        } else {
            console.log('Creating new chat using RPC...');
            const { data: newChatId, error: chatError } = await supabase
              .rpc('create_new_chat', { p_other_user_id: otherUserId });

            if (chatError) {
              console.error('Chat creation error (RPC):', chatError);
              throw chatError;
            }
            activeChatId = newChatId;
            console.log('New chat created with ID:', activeChatId);
            setChatId(activeChatId);
        }
      }

      if (!activeChatId) throw new Error('Could not determine chat ID');

      // 2. Insert the message
      console.log('[ChatScreen] Sending message. Salt in state:', chatSalt, 'type:', typeof chatSalt);
      
      // Ensure we have the salt for encryption
      let currentSalt = chatSalt;
      if (!currentSalt) {
        console.log('[ChatScreen] Salt missing in state, fetching from DB...');
        const { data: chatData } = await supabase
          .from('chats')
          .select('encryption_key_salt')
          .eq('id', activeChatId)
          .single();
        currentSalt = chatData?.encryption_key_salt || null;
        console.log('[ChatScreen] Salt fetched from DB:', currentSalt, 'type:', typeof currentSalt);
        if (currentSalt) setChatSalt(currentSalt);
      }

      const encryptedContent = type === 'text' 
        ? encryptMessage(newMessage.trim(), currentSalt || undefined)
        : encryptMessage(type === 'image' ? '[Image]' : '[Voice Message]', currentSalt || undefined);

      console.log('[ChatScreen] Message encrypted');
      const { data: sentMsg, error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChatId,
          sender_id: currentUser.id,
          content: encryptedContent,
          message_type: type,
          media_url: mediaUrl,
          media_metadata: metadata
        })
        .select()
        .single();

      if (msgError) throw msgError;
      
      // Optimistic update
      if (sentMsg) {
        console.log('[ChatScreen] Optimistic update for sent message. ID:', sentMsg.id);
        const decryptedSentMsg = {
          ...sentMsg,
          content: type === 'text' ? newMessage.trim() : (type === 'image' ? '[Image]' : '[Voice Message]')
        };
        console.log('[ChatScreen] Decrypted optimistic message content:', decryptedSentMsg.content);
        setMessages((prev) => {
          if (prev.some(m => m.id === decryptedSentMsg.id)) return prev;
          return [...prev, decryptedSentMsg];
        });
        setNewMessage('');

        // 3. Send Push Notification to the other user
        if (otherUser) {
          sendPushNotification(
            otherUser.id,
            `New message from ${currentUser.user_metadata?.username || currentUser.email}`,
            type === 'text' ? newMessage.trim() : `Sent a ${type}`,
            { type: 'chat', chatId: activeChatId }
          ).catch(err => console.error('Failed to send push notification:', err));
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
    } finally {
      setSending(false);
    }
  };

  const uploadToR2 = async (uri: string, filename: string, contentType: string) => {
    try {
      setUploadingMedia(true);
      
      // 1. Get presigned URL from Edge Function
      console.log('[ChatScreen] Requesting presigned URL for:', filename);
      const { data: signData, error: signError } = await supabase.functions.invoke('r2-sign', {
        body: { filename, contentType, action: 'upload' }
      }) as { data: any, error: any };

      if (signError) {
        console.error('[ChatScreen] Supabase function error:', signError);
        // Show more details if available
        if (signError.context && signError.context.status) {
          console.error('[ChatScreen] Error Status:', signError.context.status);
        }
        throw signError;
      }
      console.log('[ChatScreen] Sign data received:', signData);
      const { uploadUrl, publicUrl } = signData;

      // 2. Upload to R2
      console.log('[ChatScreen] Preparing upload for uri:', uri);
      
      let body: any;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        body = await response.blob();
      } else {
        // For native, fetch(uri).blob() can be problematic. 
        // We use XMLHttpRequest which is more reliable for local files in React Native.
        body = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            console.error('[ChatScreen] XHR Error:', e);
            reject(new Error('Failed to fetch local file'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      }

      console.log('[ChatScreen] Uploading to R2...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: body,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[ChatScreen] R2 Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${errorText}`);
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  };

  const pickImage = async () => {
    const ImagePicker = getImagePicker();
    if (!ImagePicker) {
      alert('Image selection is not available on this platform');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        const publicUrl = await uploadToR2(asset.uri, `image-${Date.now()}.jpg`, 'image/jpeg');
        await handleSendMessage('image', publicUrl, {
          width: asset.width,
          height: asset.height
        });
      } catch (error) {
        alert('Failed to upload image');
      }
    }
  };

  
  const startRecording = async () => {
    alert('Voice recording is currently unavailable.');
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecording(null);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUser?.id;
    
    const renderMessageContent = () => {
      if (item.message_type === 'image' && item.media_url) {
        return (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.media_url }} 
              style={[
                styles.messageImage,
                item.media_metadata?.width && item.media_metadata?.height 
                  ? { aspectRatio: item.media_metadata.width / item.media_metadata.height }
                  : { height: 200 }
              ]} 
              resizeMode="cover"
            />
          </View>
        );
      }
      
      if (item.message_type === 'voice' && item.media_url) {
        return (
          <TouchableOpacity 
            style={styles.voiceContainer}
            onPress={async () => {
              alert('Voice playback is currently unavailable.');
            }}
          >
            <Ionicons name="play" size={24} color={isMe ? '#FFFFFF' : theme.brand} />
            <ThemedText style={[styles.voiceDuration, { color: isMe ? '#FFFFFF' : theme.text }]}>
              {item.media_metadata?.duration 
                ? `${Math.floor(item.media_metadata.duration / 1000)}s`
                : 'Voice Message'}
            </ThemedText>
          </TouchableOpacity>
        );
      }

      return (
        <ThemedText style={[styles.messageText, { color: isMe ? '#FFFFFF' : theme.text }]}>
          {item.content}
        </ThemedText>
      );
    };

    return (
      <View style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        { backgroundColor: isMe ? theme.brand : theme.backgroundElement },
        item.message_type === 'image' && { padding: 4 }
      ]}>
        {renderMessageContent()}
        <ThemedText style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <ThemedText type="defaultSemiBold" style={styles.headerName}>
              {otherUser ? (otherUser.full_name || otherUser.username) : 'Chat'}
            </ThemedText>
            {otherUser && <ThemedText style={styles.headerStatus}>@{otherUser.username}</ThemedText>}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
              </View>
            }
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.backgroundElement }]}>
          <TouchableOpacity 
            style={styles.attachmentButton}
            onPress={pickImage}
            disabled={uploadingMedia || isRecording}
          >
            <Ionicons name="image-outline" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            placeholder={isRecording ? "Recording voice message..." : "Type a message..."}
            placeholderTextColor={theme.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            editable={!isRecording && !uploadingMedia}
          />

          {newMessage.trim() ? (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.brand }]}
              onPress={() => handleSendMessage('text')}
              disabled={sending || uploadingMedia}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={isRecording ? stopRecording : startRecording}
              disabled={uploadingMedia || (!isRecording && !isAudioAvailableState.current && Platform.OS !== 'web')}
              style={[
                styles.sendButton, 
                { backgroundColor: isRecording ? '#FF3B30' : theme.brand },
                (!isRecording && !isAudioAvailableState.current && Platform.OS !== 'web') && { opacity: 0.5 }
              ]}
            >
              {uploadingMedia ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={isRecording ? "stop" : (isAudioAvailableState.current || Platform.OS === 'web' ? "mic" : "mic-off")} size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.two,
  },
  headerInfo: {
    marginLeft: Spacing.one,
  },
  headerName: {
    fontSize: 18,
  },
  headerStatus: {
    fontSize: 12,
    color: '#888',
  },
  messageList: {
    padding: Spacing.four,
    paddingBottom: Spacing.two,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.three,
    borderRadius: 20,
    marginBottom: Spacing.two,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  attachmentButton: {
    padding: Spacing.two,
    marginRight: Spacing.one,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    minWidth: 200,
    borderRadius: 12,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    minWidth: 120,
  },
  voiceDuration: {
    marginLeft: Spacing.two,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    paddingTop: Spacing.two,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.three,
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
