-- Add interests column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
