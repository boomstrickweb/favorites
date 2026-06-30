-- Update the feed trigger to include more details and better metadata
CREATE OR REPLACE FUNCTION public.handle_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  catalog_name TEXT;
  val TEXT;
  cat TEXT;
  full_metadata JSONB;
BEGIN
  catalog_name := TG_ARGV[0];
  
  -- Handle field name differences
  IF catalog_name = 'sports' THEN
    val := NEW.item_id;
    cat := NULL;
  ELSE
    val := NEW.value;
    cat := NEW.category;
  END IF;

  -- Build full metadata including the original record's metadata
  -- We include 'value', 'type', and 'category' at the top level for easy access
  full_metadata := jsonb_build_object(
    'value', val,
    'type', NEW.type,
    'category', cat
  ) || COALESCE(NEW.metadata, '{}'::jsonb);
  
  INSERT INTO public.posts (user_id, catalog_type, favorite_id, metadata)
  VALUES (
    NEW.user_id,
    catalog_name,
    NEW.id,
    full_metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
