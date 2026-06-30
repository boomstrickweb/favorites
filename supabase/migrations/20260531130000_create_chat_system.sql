-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for chats (users can only see chats they are part of)
CREATE POLICY "Users can view chats they are part of" ON public.chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = chats.id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Policies for chat_participants
CREATE POLICY "Users can view their own participation" ON public.chat_participants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert participants for chats they are in" ON public.chat_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.chat_participants AS p
            WHERE p.chat_id = chat_participants.chat_id
            AND p.user_id = auth.uid()
        )
    );

-- Policies for messages
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Trigger to update last_message_at in chats when a new message is inserted
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET last_message_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- Function to get existing chat between two users
CREATE OR REPLACE FUNCTION public.get_existing_chat(p_user_id UUID)
RETURNS TABLE (chat_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT cp1.chat_id
    FROM public.chat_participants cp1
    JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
