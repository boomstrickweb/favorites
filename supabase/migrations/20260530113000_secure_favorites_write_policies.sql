-- Re-affirm secure RLS policies for all favorites tables
-- Ensure that only the owner can INSERT, UPDATE, or DELETE their records
-- SELECT remains public (true) as established in previous migration

-- Movie Favorites
DROP POLICY IF EXISTS "Users can insert their own movie favorites." ON public.movie_favorites;
CREATE POLICY "Users can insert their own movie favorites." ON public.movie_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own movie favorites." ON public.movie_favorites;
CREATE POLICY "Users can delete their own movie favorites." ON public.movie_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own movie favorites." ON public.movie_favorites;
CREATE POLICY "Users can update their own movie favorites." ON public.movie_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Music Favorites
DROP POLICY IF EXISTS "Users can insert their own music favorites." ON public.music_favorites;
CREATE POLICY "Users can insert their own music favorites." ON public.music_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own music favorites." ON public.music_favorites;
CREATE POLICY "Users can delete their own music favorites." ON public.music_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own music favorites." ON public.music_favorites;
CREATE POLICY "Users can update their own music favorites." ON public.music_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Book Favorites
DROP POLICY IF EXISTS "Users can insert their own book favorites." ON public.book_favorites;
CREATE POLICY "Users can insert their own book favorites." ON public.book_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own book favorites." ON public.book_favorites;
CREATE POLICY "Users can delete their own book favorites." ON public.book_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own book favorites." ON public.book_favorites;
CREATE POLICY "Users can update their own book favorites." ON public.book_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Sports Favorites
DROP POLICY IF EXISTS "Users can insert their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can insert their own sports favorites." ON public.sports_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can delete their own sports favorites." ON public.sports_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sports favorites." ON public.sports_favorites;
CREATE POLICY "Users can update their own sports favorites." ON public.sports_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Food Favorites
DROP POLICY IF EXISTS "Users can insert their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can insert their own food favorites." ON public.food_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can delete their own food favorites." ON public.food_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own food favorites." ON public.food_favorites;
CREATE POLICY "Users can update their own food favorites." ON public.food_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Places Favorites
DROP POLICY IF EXISTS "Users can insert their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can insert their own places favorites." ON public.places_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can delete their own places favorites." ON public.places_favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own places favorites." ON public.places_favorites;
CREATE POLICY "Users can update their own places favorites." ON public.places_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
