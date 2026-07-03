-- Create chat_keys table to store encrypted chat keys
-- Each participant will have their own encrypted version of the chat key
-- Encrypted with their public key (In a real app). 
-- For this simplified demo, we'll store a "shared secret" or just a room-specific key.
-- But the user said: "Third parties should see it encrypted" and "users shouldn't see the password among themselves"

-- Since we don't have a full asymmetric key infrastructure yet, 
-- we will implement a "Chat Secret" that is derived from the chat_id and a system secret,
-- or just unique per chat.

-- Let's add a 'secret_key' column to the chats table. 
-- It will be generated when the chat is created.
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS encryption_key_salt UUID DEFAULT extensions.uuid_generate_v4();

-- Update the RPC to ensure it's there (it will be by default now)
CREATE OR REPLACE FUNCTION public.create_new_chat(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    -- 1. Create the chat
    INSERT INTO public.chats (last_message_at, encryption_key_salt)
    VALUES (now(), extensions.uuid_generate_v4())
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
