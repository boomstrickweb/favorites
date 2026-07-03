-- Migration to support threaded comments and comment likes
-- Add parent_id for replies to comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(comment_id, user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Comment Likes Policies
CREATE POLICY "Anyone can view comment likes." ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle their own comment likes." ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
