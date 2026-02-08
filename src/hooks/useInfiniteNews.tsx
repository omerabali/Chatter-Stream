import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsItem, DbNews, CategoryType, SentimentType } from '@/types/news';
import { mockNews } from '@/data/mockNews';

const PAGE_SIZE = 12;

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

export function useInfiniteNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const initialLoadDone = useRef(false);

  const fetchPage = useCallback(async (pageNum: number, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: dbError, count } = await supabase
        .from('news')
        .select('*', { count: 'exact' })
        .order('is_breaking', { ascending: false })
        .order('published_at', { ascending: false })
        .range(from, to);

      if (dbError) {
        console.error('Error fetching news:', dbError);
        setError(dbError.message);
        if (isInitial) {
          setNews(mockNews);
        }
      } else if (data && data.length > 0) {
        const mappedNews = (data as DbNews[]).map(mapDbNewsToNewsItem);
        
        if (isInitial) {
          setNews(mappedNews);
        } else {
          setNews(prev => [...prev, ...mappedNews]);
        }

        // Check if there are more pages
        const totalFetched = from + data.length;
        setHasMore(count ? totalFetched < count : data.length === PAGE_SIZE);
      } else if (isInitial) {
        setNews(mockNews);
        setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Haberler yüklenirken bir hata oluştu');
      if (isInitial) {
        setNews(mockNews);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchPage(0, true);

      // Subscribe to realtime updates
      const channel = supabase
        .channel('news-changes-infinite')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'news',
          },
          () => {
            // Refresh the current view
            setPage(0);
            fetchPage(0, true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage, false);
    }
  }, [isLoadingMore, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  }, [fetchPage]);

  return { 
    news, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    error, 
    loadMore, 
    refresh 
  };
}
