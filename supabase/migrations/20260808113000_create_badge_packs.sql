-- Create badge_packs table
CREATE TABLE IF NOT EXISTS public.badge_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    icon TEXT DEFAULT 'gift',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badge_packs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public badge packs are viewable by everyone"
ON public.badge_packs FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view their own badge packs"
ON public.badge_packs FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own badge packs if they are premium"
ON public.badge_packs FOR INSERT
WITH CHECK (
    auth.uid() = creator_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_premium = true
    )
);

CREATE POLICY "Users can update their own badge packs"
ON public.badge_packs FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own badge packs"
ON public.badge_packs FOR DELETE
USING (auth.uid() = creator_id);
