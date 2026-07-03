-- Update RLS policies for games_favorites to allow authenticated users to view any user's favorites
-- This enables social features where users can see what games others have added

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own game favorites." ON public.games_favorites;

-- Create a more permissive policy for viewing
-- We use 'true' to allow any authenticated user to select, consistent with other categories
-- In-app privacy settings still filter these results at the application level
CREATE POLICY "Users can view any game favorites." ON public.games_favorites
  FOR SELECT USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
