-- Migration to allow post owners to delete comments on their posts
-- and ensure comment owners can still manage their own comments.

-- Drop old policy
DROP POLICY IF EXISTS "Users can manage their own comments." ON public.comments;

-- Re-create policy for comment owners
CREATE POLICY "Users can manage their own comments." 
ON public.comments 
FOR ALL 
USING (auth.uid() = user_id);

-- Add policy for post owners to delete comments
CREATE POLICY "Post owners can delete comments on their posts."
ON public.comments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
