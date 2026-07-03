-- Update handle_new_favorite to safely handle tables without a 'category' or 'value' column
CREATE OR REPLACE FUNCTION public.handle_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  catalog_name TEXT;
  val TEXT;
  cat TEXT;
  full_metadata JSONB;
BEGIN
  catalog_name := TG_ARGV[0];
  
  -- Determine 'value' (some tables use item_id)
  IF catalog_name = 'sports' THEN
    val := NEW.item_id;
  ELSE
    val := NEW.value;
  END IF;

  -- Safely determine 'category'
  -- Tables known to have 'category': movies, music, books, games
  -- Tables known NOT to have 'category': sports, food, places, vehicles
  IF catalog_name IN ('movie', 'movies', 'music', 'book', 'books', 'games') THEN
    cat := NEW.category;
  ELSE
    cat := NULL;
  END IF;

  -- Build full metadata including the original record's metadata
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
