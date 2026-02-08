import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NewsItem } from '@/types/news';

interface ViewHistory {
  news_id: string;
  category: string;
  keywords: string[];
  reading_time: number;
}

export function useNewsRecommendations(allNews: NewsItem[]) {
  const { user } = useAuth();
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchViewHistory = useCallback(async () => {
    if (!user) {
      setViewHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's view history
      const { data: views, error } = await supabase
        .from('news_views')
        .select('news_id, reading_time_seconds')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (views && views.length > 0) {
        const newsIds = [...new Set(views.map(v => v.news_id))];
        
        // Fetch news details for viewed articles
        const { data: newsData } = await supabase
          .from('news')
          .select('id, category, keywords')
          .in('id', newsIds);

        if (newsData) {
          const history: ViewHistory[] = views.map(v => {
            const newsItem = newsData.find(n => n.id === v.news_id);
            return {
              news_id: v.news_id,
              category: newsItem?.category || '',
              keywords: newsItem?.keywords || [],
              reading_time: v.reading_time_seconds || 0,
            };
          });
          setViewHistory(history);
        }
      }
    } catch (error) {
      console.error('Error fetching view history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchViewHistory();
  }, [fetchViewHistory]);

  // Calculate user preferences based on view history
  const userPreferences = useMemo(() => {
    if (viewHistory.length === 0) return null;

    // Count category occurrences weighted by reading time
    const categoryScores: Record<string, number> = {};
    const keywordScores: Record<string, number> = {};

    viewHistory.forEach(view => {
      // Higher weight for longer reading times
      const weight = Math.max(1, view.reading_time / 60); // weight by minutes
      
      if (view.category) {
        categoryScores[view.category] = (categoryScores[view.category] || 0) + weight;
      }
      
      view.keywords.forEach(keyword => {
        keywordScores[keyword.toLowerCase()] = (keywordScores[keyword.toLowerCase()] || 0) + weight;
      });
    });

    // Get top categories and keywords
    const sortedCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat]) => cat);

    const sortedKeywords = Object.entries(keywordScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([kw]) => kw);

    return {
      favoriteCategories: sortedCategories,
      favoriteKeywords: sortedKeywords,
      categoryScores,
      keywordScores,
    };
  }, [viewHistory]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!userPreferences || allNews.length === 0) {
      return [];
    }

    const viewedIds = new Set(viewHistory.map(v => v.news_id));
    const { categoryScores, keywordScores } = userPreferences;

    // Score each unseen news item
    const scoredNews = allNews
      .filter(news => !viewedIds.has(news.id))
      .map(news => {
        let score = 0;

        // Category match score
        if (categoryScores[news.category]) {
          score += categoryScores[news.category] * 2;
        }

        // Keyword match score
        news.keywords.forEach(keyword => {
          const kwLower = keyword.toLowerCase();
          if (keywordScores[kwLower]) {
            score += keywordScores[kwLower];
          }
        });

        // Recency boost (newer articles get slight boost)
        const ageHours = (Date.now() - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours < 24) {
          score *= 1.2;
        } else if (ageHours < 72) {
          score *= 1.1;
        }

        // Breaking news boost
        if (news.isBreaking) {
          score *= 1.5;
        }

        return { news, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.news);

    return scoredNews;
  }, [allNews, viewHistory, userPreferences]);

  // Get similar news for a specific article
  const getSimilarNews = useCallback((newsId: string, limit: number = 5) => {
    const targetNews = allNews.find(n => n.id === newsId);
    if (!targetNews) return [];

    const scored = allNews
      .filter(n => n.id !== newsId)
      .map(news => {
        let score = 0;

        // Same category
        if (news.category === targetNews.category) {
          score += 5;
        }

        // Shared keywords
        const targetKeywords = new Set(targetNews.keywords.map(k => k.toLowerCase()));
        news.keywords.forEach(keyword => {
          if (targetKeywords.has(keyword.toLowerCase())) {
            score += 2;
          }
        });

        // Same sentiment
        if (news.sentiment === targetNews.sentiment) {
          score += 1;
        }

        return { news, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.news);

    return scored;
  }, [allNews]);

  return {
    recommendations,
    userPreferences,
    viewHistory,
    isLoading,
    getSimilarNews,
    refetch: fetchViewHistory,
  };
}
