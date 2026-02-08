-- Create saved_news table for bookmarks
CREATE TABLE public.saved_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

-- Enable RLS
ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_news
CREATE POLICY "Users can view own saved news"
ON public.saved_news
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save news"
ON public.saved_news
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved news"
ON public.saved_news
FOR DELETE
USING (auth.uid() = user_id);

-- Add reading_time column to news_views for tracking time spent
ALTER TABLE public.news_views ADD COLUMN reading_time_seconds INTEGER DEFAULT 0;

-- Create push_subscriptions table for push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);