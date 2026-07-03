-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own blocks." ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others." ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others." ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Create a view for blocked users to easily filter them out in queries if needed,
-- but most filtering will be done via joins or subqueries in the app.
