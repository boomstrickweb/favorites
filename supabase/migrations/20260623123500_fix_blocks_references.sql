-- Update blocks table to reference public.profiles instead of auth.users
-- This enables better integration with PostgREST and avoids relationship ambiguity

-- First, remove existing foreign key constraints
ALTER TABLE public.blocks
DROP CONSTRAINT IF EXISTS blocks_blocker_id_fkey,
DROP CONSTRAINT IF EXISTS blocks_blocked_id_fkey;

-- Add the new foreign key constraints referencing public.profiles
ALTER TABLE public.blocks
ADD CONSTRAINT blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add an index on blocked_id to improve join performance for the blocked list
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
