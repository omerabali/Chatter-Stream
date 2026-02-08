import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExternalNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string | null;
  isBreaking: boolean;
}

export function useFetchNews() {
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);

  const fetchExternalNews = async (category: string = 'general'): Promise<ExternalNewsItem[]> => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { category, country: 'tr', pageSize: 20 },
      });

      if (error) throw error;

      return data.articles || [];
    } catch (error) {
      console.error('Error fetching external news:', error);
      toast({
        title: 'Hata',
        description: 'Haberler çekilirken bir hata oluştu.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsFetching(false);
    }
  };

  const saveNewsToDatabase = async (articles: ExternalNewsItem[]) => {
    try {
      // Analyze sentiment and determine category for each article before saving
      const articlesWithAnalysis = await Promise.all(
        articles.map(async (article) => {
          try {
            const { data: analysisData } = await supabase.functions.invoke('analyze-sentiment', {
              body: { title: article.title, summary: article.summary },
            });

            return {
              title: article.title,
              summary: article.summary,
              source: article.source,
              // Use AI-determined category instead of NewsAPI category
              category: analysisData?.category || article.category,
              published_at: article.publishedAt,
              image_url: article.imageUrl,
              url: article.url,
              is_breaking: article.isBreaking,
              sentiment: analysisData?.sentiment || 'neutral',
              sentiment_score: analysisData?.sentiment_score || 0.5,
              keywords: analysisData?.keywords || [],
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

      // Insert into database (upsert to avoid duplicates based on title)
      const { error } = await supabase.from('news').insert(articlesWithAnalysis);

      if (error) {
        console.error('Error saving news:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveNewsToDatabase:', error);
      return false;
    }
  };

  return { fetchExternalNews, saveNewsToDatabase, isFetching };
}
