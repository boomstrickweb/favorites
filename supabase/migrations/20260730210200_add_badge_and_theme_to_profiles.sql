-- Add profile_badge and selected_theme to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_badge TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_theme TEXT;
