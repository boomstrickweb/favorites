-- Add rating_mode to places_favorites table
ALTER TABLE public.places_favorites ADD COLUMN IF NOT EXISTS rating_mode TEXT DEFAULT 'general';

-- Update documentation comment if any
COMMENT ON COLUMN public.places_favorites.rating_mode IS 'Rating mode: general or aspects';

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
