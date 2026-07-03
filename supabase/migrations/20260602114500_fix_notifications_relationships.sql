-- Fix notifications table foreign keys to point to profiles instead of auth.users
-- This resolves PostgREST relationship detection issues (PGRST200)

-- First, drop existing constraints if they exist
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Re-add constraints pointing to public.profiles
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add a comment to explain why this was done
COMMENT ON COLUMN public.notifications.user_id IS 'References public.profiles(id) for better relationship mapping';
COMMENT ON COLUMN public.notifications.actor_id IS 'References public.profiles(id) for better relationship mapping';
