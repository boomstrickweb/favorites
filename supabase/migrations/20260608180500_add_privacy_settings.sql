-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_followers TEXT DEFAULT 'Everyone',
ADD COLUMN IF NOT EXISTS privacy_collections TEXT DEFAULT 'Everyone',
ADD COLUMN IF NOT EXISTS privacy_likes TEXT DEFAULT 'Your Followers',
ADD COLUMN IF NOT EXISTS privacy_messages TEXT DEFAULT 'Everyone';

-- Add check constraints to ensure valid values
ALTER TABLE public.profiles
ADD CONSTRAINT check_privacy_followers 
CHECK (privacy_followers IN ('Everyone', 'Followers you follow back', 'Only Me')),
ADD CONSTRAINT check_privacy_collections 
CHECK (privacy_collections IN ('Everyone', 'Your Followers', 'Followers you follow back')),
ADD CONSTRAINT check_privacy_likes 
CHECK (privacy_likes IN ('Your Followers', 'Followers you follow back', 'Only Me')),
ADD CONSTRAINT check_privacy_messages 
CHECK (privacy_messages IN ('Everyone', 'Followers you follow back', 'No one'));

-- Update RLS if necessary (optional but good practice)
-- Assuming the user can always update their own profile, which is likely already in place.
