-- Create food_favorites table
CREATE TABLE IF NOT EXISTS public.food_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'cuisine', 'dish', 'drink'
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, type, value)
);

-- Enable RLS
ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can view their own food favorites." ON public.food_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can insert their own food favorites." ON public.food_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can delete their own food favorites." ON public.food_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can update their own food favorites." ON public.food_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
