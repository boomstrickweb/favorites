-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Any authenticated user can create a chat" ON public.chats;

-- Re-create policy with simplified check
CREATE POLICY "Any authenticated user can create a chat" ON public.chats
    FOR INSERT WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Add UPDATE policy for chats to allow updating last_message_at
CREATE POLICY "Users can update chats they are part of" ON public.chats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = chats.id
            AND chat_participants.user_id = auth.uid()
        )
    );
