import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsItem, DbNews, CategoryType, SentimentType } from '@/types/news';
import { mockNews } from '@/data/mockNews';

const mapDbNewsToNewsItem = (dbNews: DbNews): NewsItem => ({
  id: dbNews.id,
  title: dbNews.title,
  summary: dbNews.summary,
  source: dbNews.source,
  category: dbNews.category as CategoryType,
  sentiment: dbNews.sentiment as SentimentType,
  sentimentScore: Number(dbNews.sentiment_score),
  publishedAt: new Date(dbNews.published_at),
  isBreaking: dbNews.is_breaking,
  keywords: dbNews.keywords || [],
  imageUrl: dbNews.image_url || undefined,
  url: dbNews.url || undefined,
});

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: dbError } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (dbError) {
        if (import.meta.env.DEV) {
          console.error('Error fetching news:', dbError);
        }
        setError('Haberler yüklenirken bir hata oluştu');
        // Fall back to mock data if database fetch fails
        setNews(mockNews);
      } else if (data && data.length > 0) {
        setNews((data as DbNews[]).map(mapDbNewsToNewsItem));
      } else {
        // If no news in database, use mock data
        setNews(mockNews);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error:', err);
      }
      setError('Haberler yüklenirken bir hata oluştu');
      setNews(mockNews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        () => {
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refresh = () => {
    fetchNews();
  };

  return { news, isLoading, error, refresh };
}
