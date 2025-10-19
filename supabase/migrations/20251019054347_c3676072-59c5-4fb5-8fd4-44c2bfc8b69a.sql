-- Create table for user favorites
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id)
);

-- Enable RLS on user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
ON public.user_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON public.user_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for shared designs in community feed
CREATE TABLE public.shared_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared_designs
ALTER TABLE public.shared_designs ENABLE ROW LEVEL SECURITY;

-- Everyone can view shared designs
CREATE POLICY "Anyone can view shared designs"
ON public.shared_designs
FOR SELECT
USING (true);

-- Users can insert their own shared designs
CREATE POLICY "Users can insert their own designs"
ON public.shared_designs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared designs
CREATE POLICY "Users can update their own designs"
ON public.shared_designs
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shared designs
CREATE POLICY "Users can delete their own designs"
ON public.shared_designs
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for room likes
CREATE TABLE public.room_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.shared_designs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, design_id)
);

-- Enable RLS on room_likes
ALTER TABLE public.room_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Anyone can view likes"
ON public.room_likes
FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes"
ON public.room_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.room_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for custom product links
CREATE TABLE public.custom_product_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  custom_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id, product_name)
);

-- Enable RLS on custom_product_links
ALTER TABLE public.custom_product_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own custom links
CREATE POLICY "Users can view their own custom links"
ON public.custom_product_links
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own custom links
CREATE POLICY "Users can insert their own custom links"
ON public.custom_product_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom links
CREATE POLICY "Users can update their own custom links"
ON public.custom_product_links
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own custom links
CREATE POLICY "Users can delete their own custom links"
ON public.custom_product_links
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom_product_links
CREATE TRIGGER update_custom_product_links_updated_at
BEFORE UPDATE ON public.custom_product_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();