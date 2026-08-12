-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES public.badge_packs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Badges are viewable by everyone if the pack is public"
ON public.badges FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.badge_packs
        WHERE id = pack_id AND is_public = true
    )
);

CREATE POLICY "Users can view badges in their own packs"
ON public.badges FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.badge_packs
        WHERE id = pack_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Pack owners can insert badges"
ON public.badges FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.badge_packs
        WHERE id = pack_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Pack owners can update badges"
ON public.badges FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.badge_packs
        WHERE id = pack_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Pack owners can delete badges"
ON public.badges FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.badge_packs
        WHERE id = pack_id AND creator_id = auth.uid()
    )
);
