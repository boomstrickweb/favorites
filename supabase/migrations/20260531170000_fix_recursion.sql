-- Fix infinite recursion in chat_participants policy
-- The previous SELECT policy on chat_participants used an EXISTS check on the same table,
-- which caused infinite recursion because the EXISTS check itself triggered the policy.

-- 1. Redefine chat_participants SELECT policy to avoid self-recursion
-- Instead of checking if the user is a participant of the same chat (which requires SELECTing from the same table),
-- we can keep it simple: users can see their own participant records.
-- To allow seeing OTHER participants in the same chat, we can't easily use a SELECT policy on the same table without recursion.
-- However, for the 'chats' UPDATE policy and 'messages' INSERT policy, they use EXISTS which triggers this.

DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.chat_participants;

-- Simple policy: you can see a participant record if you are THAT participant,
-- OR if you are a participant in the same chat. 
-- To avoid recursion, we use a subquery that specifically targets the authenticated user's ID
-- but Postgres might still flag it.

-- A better way is to use a SECURITY DEFINER function to check participation,
-- as SECURITY DEFINER functions bypass RLS.

CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_id = p_chat_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the policies to use this function
CREATE POLICY "Users can view participants in their chats" ON public.chat_participants
    FOR SELECT USING (public.is_chat_participant(chat_id));

-- Also update chats table policies to use this function for consistency and to avoid recursion issues there too
DROP POLICY IF EXISTS "Users can view chats they are part of" ON public.chats;
CREATE POLICY "Users can view chats they are part of" ON public.chats
    FOR SELECT USING (public.is_chat_participant(id));

DROP POLICY IF EXISTS "Users can update chats they are part of" ON public.chats;
CREATE POLICY "Users can update chats they are part of" ON public.chats
    FOR UPDATE USING (public.is_chat_participant(id));

-- Update messages policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (public.is_chat_participant(chat_id));

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        public.is_chat_participant(chat_id)
    );
