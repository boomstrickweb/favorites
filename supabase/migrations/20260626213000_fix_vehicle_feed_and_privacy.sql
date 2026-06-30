-- Add trigger for feed for vehicle_favorites
CREATE OR REPLACE TRIGGER on_vehicle_favorite_added
  AFTER INSERT ON public.vehicle_favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('vehicles');

-- Ensure RLS allows viewing other users' favorites (privacy is handled in-app but database should allow SELECT)
-- Check if policy already exists to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicle_favorites' AND policyname = 'Users can view all vehicle favorites.'
    ) THEN
        CREATE POLICY "Users can view all vehicle favorites." ON public.vehicle_favorites
          FOR SELECT USING (true);
    END IF;
END $$;
