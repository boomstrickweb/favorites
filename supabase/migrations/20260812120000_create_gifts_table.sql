-- Create gifts table
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    gift_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Gifts are viewable by everyone" ON public.gifts
    FOR SELECT USING (true);

CREATE POLICY "Users can send gifts" ON public.gifts
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS gifts_sender_id_idx ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS gifts_receiver_id_idx ON public.gifts(receiver_id);
CREATE INDEX IF NOT EXISTS gifts_created_at_idx ON public.gifts(created_at);
