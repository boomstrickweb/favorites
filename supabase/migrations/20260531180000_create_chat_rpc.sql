-- Create a robust chat initialization function
-- This handles creating the chat and adding both participants in a single atomic transaction.
-- Using SECURITY DEFINER to bypass complex RLS during initialization.

CREATE OR REPLACE FUNCTION public.create_new_chat(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    -- 1. Create the chat
    INSERT INTO public.chats (last_message_at)
    VALUES (now())
    RETURNING id INTO v_chat_id;

    -- 2. Add current user as participant
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (v_chat_id, auth.uid());

    -- 3. Add other user as participant
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (v_chat_id, p_other_user_id);

    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also, let's fix the INSERT policy for chats one more time to be absolutely sure
-- even though we'll prefer the RPC.
DROP POLICY IF EXISTS "Any authenticated user can create a chat" ON public.chats;
CREATE POLICY "Any authenticated user can create a chat" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
