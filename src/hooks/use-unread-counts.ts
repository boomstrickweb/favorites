import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useUnreadCounts() {
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [chatCount, setChatCount] = useState<number>(0);

  const fetchUnreadCounts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch unread notifications
    const { count: notifCount, error: notifError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!notifError) {
      setNotificationCount(notifCount || 0);
    }

    // Fetch unread messages
    // Note: We count unique chats with unread messages for the badge
    const { data: unreadMessages, error: msgError } = await supabase
      .from('messages')
      .select('chat_id')
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (!msgError) {
      const uniqueChats = new Set(unreadMessages?.map(m => m.chat_id));
      setChatCount(uniqueChats.size);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCounts();

    const notifSubscription = supabase
      .channel('unread-notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    const msgSubscription = supabase
      .channel('unread-messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifSubscription);
      supabase.removeChannel(msgSubscription);
    };
  }, [fetchUnreadCounts]);

  return { notificationCount, chatCount, refresh: fetchUnreadCounts };
}
