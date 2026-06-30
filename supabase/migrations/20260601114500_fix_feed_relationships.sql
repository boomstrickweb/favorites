-- Fix foreign key relationships for feed system to allow PostgREST joins
-- Change user_id references from auth.users to public.profiles

-- First, drop existing foreign keys if they exist (they were created in 20260601113000_create_feed_system.sql)
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE IF EXISTS public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Update references to public.profiles(id)
ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
