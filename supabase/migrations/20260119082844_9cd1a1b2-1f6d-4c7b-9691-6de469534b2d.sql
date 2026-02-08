-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for news images
CREATE POLICY "Public can read news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'news-images' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update news images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'news-images' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete news images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'news-images' 
  AND auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fix news_views RLS policy - Remove public access to user_id data
DROP POLICY IF EXISTS "Anyone can read views" ON public.news_views;

-- Create new policy that only allows reading aggregate counts (not user_id)
CREATE POLICY "Users can read own views"
ON public.news_views FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Update insert policy to require some validation
DROP POLICY IF EXISTS "Anyone can insert views" ON public.news_views;

CREATE POLICY "Authenticated users and anonymous can insert views"
ON public.news_views FOR INSERT
WITH CHECK (
  -- Must match current user if authenticated, or be null for anonymous
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);