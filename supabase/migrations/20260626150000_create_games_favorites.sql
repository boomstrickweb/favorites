-- Create games_favorites table in Supabase
CREATE TABLE IF NOT EXISTS public.games_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'game' or 'genre'
  category TEXT, -- For subgenres or grouping
  value TEXT NOT NULL, -- Game name or Genre name
  rating_mode TEXT DEFAULT 'none',
  rating_general INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, value)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.games_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own game favorites." ON public.games_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game favorites." ON public.games_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game favorites." ON public.games_favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own game favorites." ON public.games_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for feed
CREATE TRIGGER on_game_favorite_added
  AFTER INSERT ON public.games_favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('games');
