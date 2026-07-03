-- Create movie_favorites table in Supabase
CREATE TABLE IF NOT EXISTS public.movie_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'genre', 'actor', 'movie', 'series'
  category TEXT,      -- e.g., 'Action & Adventure' for genres
  value TEXT NOT NULL, -- The actual value (e.g., 'Martial Arts')
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, value)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.movie_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own movie favorites." ON public.movie_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movie favorites." ON public.movie_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movie favorites." ON public.movie_favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own movie favorites." ON public.movie_favorites
  FOR UPDATE USING (auth.uid() = user_id);
