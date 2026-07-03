-- Migration to remove password_hash from profiles table
-- This column was removed because password management is handled by Supabase Auth,
-- and storing it in the profiles table was redundant and less secure.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;
