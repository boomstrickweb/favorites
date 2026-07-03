-- Add rating columns to vehicle_favorites table
ALTER TABLE public.vehicle_favorites 
ADD COLUMN IF NOT EXISTS rating_mode TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS rating_general INTEGER DEFAULT 0;
