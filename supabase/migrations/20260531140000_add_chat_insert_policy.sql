-- Add INSERT policy for chats table
CREATE POLICY "Any authenticated user can create a chat" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update chat_participants INSERT policy to be more clear
DROP POLICY IF EXISTS "Users can insert participants for chats they are in" ON public.chat_participants;
CREATE POLICY "Users can insert themselves as participants" ON public.chat_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can add others to chats they are part of" ON public.chat_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS p
            WHERE p.chat_id = chat_participants.chat_id
            AND p.user_id = auth.uid()
        )
    );
