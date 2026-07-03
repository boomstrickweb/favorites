-- Update RLS policies to allow authenticated users to view any user's favorites
-- This allows for social features where users can view each other's collections

-- Movie Favorites
DROP POLICY IF EXISTS "Users can view their own movie favorites." ON public.movie_favorites;
CREATE POLICY "Users can view any movie favorites." ON public.movie_favorites
  FOR SELECT USING (true);

-- Music Favorites
DROP POLICY IF EXISTS "Users can view their own music favorites." ON public.music_favorites;
CREATE POLICY "Users can view any music favorites." ON public.music_favorites
  FOR SELECT USING (true);

-- Book Favorites
DROP POLICY IF EXISTS "Users can view their own book favorites." ON public.book_favorites;
CREATE POLICY "Users can view any book favorites." ON public.book_favorites
  FOR SELECT USING (true);

-- Sports Favorites
DROP POLICY IF EXISTS "Users can view their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can view any sports favorites." ON public.sports_favorites
  FOR SELECT USING (true);

-- Food Favorites
DROP POLICY IF EXISTS "Users can view their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can view any food favorites." ON public.food_favorites
  FOR SELECT USING (true);

-- Places Favorites
DROP POLICY IF EXISTS "Users can view their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can view any places favorites." ON public.places_favorites
  FOR SELECT USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
