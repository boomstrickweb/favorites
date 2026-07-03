-- Add media support to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_metadata JSONB;

-- Update RLS policies to ensure media_url and media_metadata are handled
-- Existing policies already cover SELECT and INSERT for all columns, 
-- but let's be explicit if needed. For now, the existing ones are sufficient
-- as they use * or don't restrict columns.
