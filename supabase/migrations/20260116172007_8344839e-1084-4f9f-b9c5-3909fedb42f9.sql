-- Add parent_id for threaded comments (replies)
ALTER TABLE public.news_comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.news_comments(id) ON DELETE CASCADE;

-- Create index for faster reply queries
CREATE INDEX IF NOT EXISTS idx_news_comments_parent_id ON public.news_comments(parent_id);

-- Create comment reactions table for emoji reactions
CREATE TABLE public.comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.news_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Anyone can view reactions" ON public.comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react" ON public.comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create email preferences table for notification settings
CREATE TABLE public.email_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  daily_digest boolean NOT NULL DEFAULT true,
  breaking_news boolean NOT NULL DEFAULT true,
  favorite_categories_updates boolean NOT NULL DEFAULT true,
  last_digest_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for email preferences
CREATE POLICY "Users can view own preferences" ON public.email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.email_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_reactions;