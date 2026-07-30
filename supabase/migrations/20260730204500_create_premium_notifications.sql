-- Create premium_notifications table
CREATE TABLE IF NOT EXISTS public.premium_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(subscriber_id, target_id)
);

-- Enable RLS
ALTER TABLE public.premium_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own premium notifications."
  ON public.premium_notifications FOR SELECT
  USING (auth.uid() = subscriber_id);

CREATE POLICY "Users can insert their own premium notifications."
  ON public.premium_notifications FOR INSERT
  WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can delete their own premium notifications."
  ON public.premium_notifications FOR DELETE
  USING (auth.uid() = subscriber_id);

-- Function to check the 5-profile limit
CREATE OR REPLACE FUNCTION check_premium_notifications_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.premium_notifications WHERE subscriber_id = NEW.subscriber_id) >= 5 THEN
    RAISE EXCEPTION 'You can only enable notifications for up to 5 profiles.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce the limit
CREATE TRIGGER enforce_premium_notifications_limit
  BEFORE INSERT ON public.premium_notifications
  FOR EACH ROW
  EXECUTE FUNCTION check_premium_notifications_limit();
