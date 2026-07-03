-- Create posts table (feed items)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  catalog_type TEXT NOT NULL, -- 'music', 'movie', 'book', 'sports', 'food', 'places'
  favorite_id UUID NOT NULL, -- ID from the respective favorite table
  content TEXT, -- Optional text from user (currently unused as per requirements)
  metadata JSONB DEFAULT '{}'::jsonb, -- Store details about the favorite (name, type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Anyone can view posts." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Likes Policies
CREATE POLICY "Anyone can view likes." ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle their own likes." ON public.likes FOR ALL USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Anyone can view comments." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can manage their own comments." ON public.comments FOR ALL USING (auth.uid() = user_id);

-- Trigger function to automatically create a post when a favorite is added
CREATE OR REPLACE FUNCTION public.handle_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  catalog_name TEXT;
  val TEXT;
  cat TEXT;
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
  
  INSERT INTO public.posts (user_id, catalog_type, favorite_id, metadata)
  VALUES (
    NEW.user_id,
    catalog_name,
    NEW.id,
    jsonb_build_object(
      'value', val,
      'type', NEW.type,
      'category', cat
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to each favorites table
CREATE TRIGGER music_favorite_added
AFTER INSERT ON public.music_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('music');

CREATE TRIGGER movie_favorite_added
AFTER INSERT ON public.movie_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('movie');

CREATE TRIGGER book_favorite_added
AFTER INSERT ON public.book_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('book');

CREATE TRIGGER sports_favorite_added
AFTER INSERT ON public.sports_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('sports');

CREATE TRIGGER food_favorite_added
AFTER INSERT ON public.food_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('food');

CREATE TRIGGER places_favorite_added
AFTER INSERT ON public.places_favorites
FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite('places');
