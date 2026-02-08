import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = ['general', 'business', 'technology', 'sports', 'health', 'entertainment', 'science'];

export function useAutoFetchNews(intervalMinutes: number = 2, enabled: boolean = true) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [newNewsCount, setNewNewsCount] = useState(0);

  const fetchAndSaveNews = useCallback(async (category: string = 'general') => {
    try {
      // Fetch from NewsAPI
      const { data: newsData, error: fetchError } = await supabase.functions.invoke('fetch-news', {
        body: { category, country: 'tr', pageSize: 10 },
      });

      if (fetchError) throw fetchError;

      const articles = newsData.articles || [];
      if (articles.length === 0) return 0;

      // Check for duplicates by title
      const titles = articles.map((a: any) => a.title);
      const { data: existingNews } = await supabase
        .from('news')
        .select('title')
        .in('title', titles);

      const existingTitles = new Set(existingNews?.map((n) => n.title) || []);
      const newArticles = articles.filter((a: any) => !existingTitles.has(a.title));

      if (newArticles.length === 0) return 0;

      // Analyze sentiment for new articles
      const articlesWithSentiment = await Promise.all(
        newArticles.map(async (article: any) => {
          try {
            const { data: sentimentData } = await supabase.functions.invoke('analyze-sentiment', {
              body: { title: article.title, summary: article.summary },
            });

            return {
              title: article.title,
              summary: article.summary,
              source: article.source,
              category: article.category,
              published_at: article.publishedAt,
              image_url: article.imageUrl,
              url: article.url,
              is_breaking: article.isBreaking,
              sentiment: sentimentData?.sentiment || 'neutral',
              sentiment_score: sentimentData?.sentiment_score || 0.5,
              keywords: sentimentData?.keywords || [],
            };
          } catch {
            return {
              title: article.title,
              summary: article.summary,
              source: article.source,
              category: article.category,
              published_at: article.publishedAt,
              image_url: article.imageUrl,
              url: article.url,
              is_breaking: article.isBreaking,
              sentiment: 'neutral',
              sentiment_score: 0.5,
              keywords: [],
            };
          }
        })
      );

      // Insert new articles
      const { error: insertError } = await supabase.from('news').insert(articlesWithSentiment);
      if (insertError) throw insertError;

      return articlesWithSentiment.length;
    } catch (error) {
      console.error('Auto fetch error:', error);
      return 0;
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    if (isFetching) return;
    
    setIsFetching(true);
    let totalNew = 0;

    try {
      // Fetch from multiple categories
      for (const category of CATEGORIES.slice(0, 3)) { // Limit to 3 categories per fetch
        const newCount = await fetchAndSaveNews(category);
        totalNew += newCount;
        
        // Small delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setLastFetch(new Date());
      
      if (totalNew > 0) {
        setNewNewsCount((prev) => prev + totalNew);
        toast({
          title: '🔴 Yeni Haberler',
          description: `${totalNew} yeni haber eklendi!`,
        });
      }
    } catch (error) {
      console.error('Fetch all categories error:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchAndSaveNews, isFetching, toast]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch after 10 seconds
    const initialTimeout = setTimeout(() => {
      fetchAllCategories();
    }, 10000);

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchAllCategories();
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMinutes, fetchAllCategories]);

  const clearNewCount = () => setNewNewsCount(0);
  const manualFetch = () => fetchAllCategories();

  return { 
    lastFetch, 
    isFetching, 
    newNewsCount, 
    clearNewCount,
    manualFetch 
  };
}
