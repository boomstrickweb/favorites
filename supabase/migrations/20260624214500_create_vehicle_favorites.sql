-- Create vehicle_favorites table in Supabase
CREATE TABLE IF NOT EXISTS public.vehicle_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'vehicle'
  value TEXT NOT NULL, -- Model Name
  rating_mode TEXT DEFAULT 'none',
  rating_general INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, value)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.vehicle_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own vehicle favorites." ON public.vehicle_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicle favorites." ON public.vehicle_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle favorites." ON public.vehicle_favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle favorites." ON public.vehicle_favorites
  FOR UPDATE USING (auth.uid() = user_id);
