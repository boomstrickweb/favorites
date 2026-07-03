-- Ensure sports_favorites table exists (Force creation if missing)
CREATE TABLE IF NOT EXISTS public.sports_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'sport', 'team', 'player', etc.
  item_id TEXT NOT NULL, -- The name or ID of the sport/team/etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, item_id)
);

-- Ensure RLS is enabled
ALTER TABLE public.sports_favorites ENABLE ROW LEVEL SECURITY;

-- Re-create policies to be sure they exist
DROP POLICY IF EXISTS "Users can view their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can view their own sports favorites." ON public.sports_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can insert their own sports favorites." ON public.sports_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can delete their own sports favorites." ON public.sports_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can update their own sports favorites." ON public.sports_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
