-- Create user_news_tags table for custom tags
CREATE TABLE public.user_news_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create news_tag_assignments for linking tags to news
CREATE TABLE public.news_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.user_news_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.user_news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_news_tags
CREATE POLICY "Users can view own tags" ON public.user_news_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON public.user_news_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.user_news_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.user_news_tags FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for news_tag_assignments
CREATE POLICY "Users can view own tag assignments" ON public.news_tag_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tag assignments" ON public.news_tag_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tag assignments" ON public.news_tag_assignments FOR DELETE USING (auth.uid() = user_id);