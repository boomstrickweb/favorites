-- Add stalk_mode to profiles and create profile_views table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stalk_mode BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_stalk_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see views on their own profile" ON public.profile_views
  FOR SELECT USING (auth.uid() = viewed_id);

CREATE POLICY "Users can insert their own views" ON public.profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Function to handle profile view logic:
-- 1. Check if record exists in last 24h for this pair -> skip
-- 2. If stalk mode is true, check if 24h limit (10 profiles) is reached
CREATE OR REPLACE FUNCTION public.record_profile_view(p_viewer_id UUID, p_viewed_id UUID, p_is_stalk_mode BOOLEAN)
RETURNS VOID AS $$
DECLARE
  v_last_view_id UUID;
  v_stalk_count INTEGER;
BEGIN
  -- 1. Check for record in last 24 hours
  SELECT id INTO v_last_view_id
  FROM public.profile_views
  WHERE viewer_id = p_viewer_id 
    AND viewed_id = p_viewed_id
    AND created_at > (now() - interval '24 hours')
  LIMIT 1;

  IF v_last_view_id IS NOT NULL THEN
    RETURN; -- Already recorded in last 24h
  END IF;

  -- 2. If stalk mode is true, check 24h limit (10 DIFFERENT profiles)
  IF p_is_stalk_mode THEN
    SELECT count(DISTINCT viewed_id) INTO v_stalk_count
    FROM public.profile_views
    WHERE viewer_id = p_viewer_id
      AND is_stalk_mode = TRUE
      AND created_at > (now() - interval '24 hours');

    IF v_stalk_count >= 10 THEN
      -- Limit reached, insert but force is_stalk_mode to FALSE because they can't stalk more
      -- Or should we just fail? The prompt says "You can stalk up to 10 different profiles every 24 hours."
      -- I'll insert it as a non-stalk view if limit reached, or just throw error?
      -- Throwing error is cleaner for the app to handle and inform user.
      RAISE EXCEPTION 'Stalk limit reached. You can stalk up to 10 different profiles every 24 hours.';
    END IF;
  END IF;

  -- 3. Insert record
  INSERT INTO public.profile_views (viewer_id, viewed_id, is_stalk_mode)
  VALUES (p_viewer_id, p_viewed_id, p_is_stalk_mode);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
