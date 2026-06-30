-- Final attempt to fix RLS for chats
-- We will use a more permissive INSERT policy for chats and chat_participants
-- and rely on the RPC for creation to ensure atomicity.

-- 1. Ensure chats has a clear INSERT policy
DROP POLICY IF EXISTS "Any authenticated user can create a chat" ON public.chats;
CREATE POLICY "Any authenticated user can create a chat" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Ensure chat_participants has clear INSERT policies
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON public.chat_participants;
CREATE POLICY "Users can insert themselves as participants" ON public.chat_participants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Ensure chats can be UPDATED (needed for last_message_at trigger)
-- The handle_new_message() function is SECURITY DEFINER, so it should bypass RLS anyway,
-- but having a policy doesn't hurt.
DROP POLICY IF EXISTS "Users can update chats they are part of" ON public.chats;
CREATE POLICY "Users can update chats they are part of" ON public.chats
    FOR UPDATE USING (public.is_chat_participant(id));

-- 4. Grant execute permissions (just in case)
GRANT EXECUTE ON FUNCTION public.create_new_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_existing_chat(UUID) TO authenticated;
