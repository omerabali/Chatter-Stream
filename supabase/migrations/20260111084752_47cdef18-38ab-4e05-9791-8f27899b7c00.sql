-- Create a table for news likes
CREATE TABLE public.news_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);

-- Create a table for news comments
CREATE TABLE public.news_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for news_likes
CREATE POLICY "Anyone can view likes" ON public.news_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON public.news_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.news_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for news_comments  
CREATE POLICY "Anyone can view comments" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.news_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.news_comments FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on comments
CREATE TRIGGER update_news_comments_updated_at
BEFORE UPDATE ON public.news_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments;