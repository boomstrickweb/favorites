-- Add SELECT policy for chat_participants to allow viewing all participants in a chat
-- This is needed for the chats UPDATE policy which uses EXISTS on chat_participants
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS p
            WHERE p.chat_id = chat_participants.chat_id
            AND p.user_id = auth.uid()
        )
    );

-- Also ensure users can see their own participation (keeping it for safety)
DROP POLICY IF EXISTS "Users can view their own participation" ON public.chat_participants;
CREATE POLICY "Users can view their own participation" ON public.chat_participants
    FOR SELECT USING (user_id = auth.uid());

-- Ensure the UPDATE policy for chats is correct and uses a subquery that doesn't rely on the policy itself if possible
-- Actually, the current one is:
-- CREATE POLICY "Users can update chats they are part of" ON public.chats
--    FOR UPDATE USING (
--        EXISTS (
--            SELECT 1 FROM public.chat_participants
--            WHERE chat_participants.chat_id = chats.id
--            AND chat_participants.user_id = auth.uid()
--        )
--    );
-- This policy relies on being able to SELECT from chat_participants.
