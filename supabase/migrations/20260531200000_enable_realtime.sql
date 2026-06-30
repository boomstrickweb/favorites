-- Enable Realtime for messages and chats tables
-- This adds the tables to the supabase_realtime publication
-- allowing the client to receive real-time updates via subscriptions.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
