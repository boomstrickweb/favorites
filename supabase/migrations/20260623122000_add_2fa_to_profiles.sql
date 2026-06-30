-- Add 2FA columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[];

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.two_factor_secret IS 'Encrypted TOTP secret for two-factor authentication';
COMMENT ON COLUMN public.profiles.two_factor_recovery_codes IS 'Array of recovery codes for two-factor authentication';
