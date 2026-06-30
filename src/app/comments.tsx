import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Spacing } from '@/constants/theme';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  comment_likes?: { count: number }[];
  replies?: Comment[];
  is_liked?: boolean;
}

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch post owner to allow them to delete comments
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (postData) {
        setPostOwnerId(postData.user_id);
      }

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          comment_likes(count)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which comments are liked by current user
      let likedCommentIds: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        likedCommentIds = likesData?.map(l => l.comment_id) || [];
      }

      const formattedComments = (data || []).map(comment => ({
        ...comment,
        is_liked: likedCommentIds.includes(comment.id)
      }));

      // Organize comments into threads
      const rootComments = formattedComments.filter(c => !c.parent_id);
      const replies = formattedComments.filter(c => c.parent_id);

      const threaded = rootComments.map(root => {
        const rootReplies = replies.filter(r => r.parent_id === root.id);
        console.log(`Thread for ${root.id}: ${rootReplies.length} replies`);
        return {
          ...root,
          replies: rootReplies
        };
      });

      console.log('Total threaded comments:', threaded.length);
      setComments(threaded);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting || !currentUserId) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: replyingTo ? (replyingTo.parent_id || replyingTo.id) : null // Max 2 levels depth
        });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUserId });
      }
      
      // Optimistic update
      setComments(prev => {
        const updateList = (list: Comment[]): Comment[] => {
          return list.map(c => {
            if (c.id === commentId) {
              const newCount = (c.comment_likes?.[0]?.count || 0) + (isLiked ? -1 : 1);
              return { ...c, is_liked: !isLiked, comment_likes: [{ count: newCount }] };
            }
            if (c.replies) {
              return { ...c, replies: updateList(c.replies) };
            }
            return c;
          });
        };
        return updateList(prev);
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    console.log('Attempting to delete comment:', commentId);
    
    // On web, Alert.alert works differently or might not be available in some environments
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this comment?');
      if (confirmed) {
        performDelete(commentId);
      }
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => performDelete(commentId)
        }
      ]
    );
  };

  const performDelete = async (commentId: string) => {
    try {
      console.log('Performing delete for:', commentId);
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Delete successful');
      await fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', `Failed to delete comment: ${error.message || 'Unknown error'}`);
    }
  };

  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.profiles.username} `);
    inputRef.current?.focus();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentRow}>
        <Image 
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/40' }} 
          style={styles.avatar} 
        />
        <View style={styles.commentContent}>
          <ThemedText style={styles.username}>{item.profiles.username}</ThemedText>
          <ThemedText style={styles.text}>{item.content}</ThemedText>
          <View style={styles.commentActions}>
            <ThemedText style={styles.timeAgo}>
              {new Date(item.created_at).toLocaleDateString()}
            </ThemedText>
            <TouchableOpacity onPress={() => startReply(item)}>
              <ThemedText style={styles.actionText}>Reply</ThemedText>
            </TouchableOpacity>
            {(item.user_id === currentUserId || postOwnerId === currentUserId) && (
              <TouchableOpacity 
                onPress={() => handleDelete(item.id)} 
                style={{ paddingHorizontal: Spacing.two }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ThemedText style={[styles.actionText, { color: theme.brand }]}>Delete</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleLike(item.id, !!item.is_liked)}
        >
          <Ionicons 
            name={item.is_liked ? "heart" : "heart-outline"} 
            size={18} 
            color={item.is_liked ? theme.brand : theme.textSecondary} 
          />
          <ThemedText style={styles.likeCount}>
            {item.comment_likes?.[0]?.count || 0}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesList}>
          {item.replies.map(reply => (
            <View key={reply.id} style={styles.commentRow}>
               <Image 
                source={{ uri: reply.profiles.avatar_url || 'https://via.placeholder.com/32' }} 
                style={[styles.avatar, styles.replyAvatar]} 
              />
              <View style={styles.commentContent}>
                <ThemedText style={styles.username}>{reply.profiles.username}</ThemedText>
                <ThemedText style={styles.text}>{reply.content}</ThemedText>
                <View style={styles.commentActions}>
                  <ThemedText style={styles.timeAgo}>
                    {new Date(reply.created_at).toLocaleDateString()}
                  </ThemedText>
                  {(reply.user_id === currentUserId || postOwnerId === currentUserId) && (
                    <TouchableOpacity 
                      onPress={() => handleDelete(reply.id)}
                      style={{ paddingHorizontal: Spacing.two }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ThemedText style={[styles.actionText, { color: theme.brand }]}>Delete</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.likeButton}
                onPress={() => handleLike(reply.id, !!reply.is_liked)}
              >
                <Ionicons 
                  name={reply.is_liked ? "heart" : "heart-outline"} 
                  size={16} 
                  color={reply.is_liked ? theme.brand : theme.textSecondary} 
                />
                <ThemedText style={styles.likeCount}>
                  {reply.comment_likes?.[0]?.count || 0}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>Comments</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.brand} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText style={{ color: theme.textSecondary }}>No comments yet. Be the first!</ThemedText>
              </View>
            }
          />
        )}

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {replyingTo && (
            <View style={[styles.replyingBar, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.replyingText}>
                Replying to <ThemedText style={{ fontWeight: 'bold' }}>{replyingTo.profiles.username}</ThemedText>
              </ThemedText>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Write a comment..."
              placeholderTextColor={theme.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={!newComment.trim() || submitting}
              style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.5 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.brand} />
              ) : (
                <Ionicons name="send" size={24} color={theme.brand} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.four,
  },
  commentContainer: {
    marginBottom: Spacing.three,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.two,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    paddingTop: 2,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
    gap: Spacing.three,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  likeButton: {
    alignItems: 'center',
    paddingLeft: Spacing.two,
  },
  likeCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  repliesList: {
    marginLeft: 48,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  emptyState: {
    padding: Spacing.five,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: Spacing.two,
    padding: 4,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-between',
  },
  replyingText: {
    fontSize: 13,
  },
});
