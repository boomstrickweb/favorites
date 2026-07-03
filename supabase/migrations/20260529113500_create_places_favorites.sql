-- Create places_favorites table
CREATE TABLE IF NOT EXISTS public.places_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'country'
  value TEXT NOT NULL,
  rating_general INTEGER DEFAULT 0,
  rating_gastronomy INTEGER DEFAULT 0,
  rating_culture INTEGER DEFAULT 0,
  rating_nature INTEGER DEFAULT 0,
  rating_vibe INTEGER DEFAULT 0,
  rating_affordability INTEGER DEFAULT 0,
  traveled BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, value)
);

-- Enable RLS
ALTER TABLE public.places_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can view their own places favorites." ON public.places_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can insert their own places favorites." ON public.places_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can delete their own places favorites." ON public.places_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can update their own places favorites." ON public.places_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
