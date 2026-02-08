import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReadingStats {
  totalViews: number;
  totalReadingTime: number;
  categoryStats: { category: string; count: number }[];
  recentViews: { news_id: string; viewed_at: string; reading_time_seconds: number }[];
}

export function useReadingStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's views
      const { data: views } = await supabase
        .from('news_views')
        .select('news_id, viewed_at, reading_time_seconds')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });

      if (!views || views.length === 0) {
        setStats({
          totalViews: 0,
          totalReadingTime: 0,
          categoryStats: [],
          recentViews: [],
        });
        setIsLoading(false);
        return;
      }

      // Get news details for category stats
      const newsIds = [...new Set(views.map((v) => v.news_id))];
      const { data: newsData } = await supabase
        .from('news')
        .select('id, category')
        .in('id', newsIds);

      // Calculate category stats
      const categoryCount: Record<string, number> = {};
      views.forEach((view) => {
        const news = newsData?.find((n) => n.id === view.news_id);
        if (news) {
          categoryCount[news.category] = (categoryCount[news.category] || 0) + 1;
        }
      });

      const categoryStats = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate total reading time
      const totalReadingTime = views.reduce(
        (sum, v) => sum + (v.reading_time_seconds || 0),
        0
      );

      setStats({
        totalViews: views.length,
        totalReadingTime,
        categoryStats,
        recentViews: views.slice(0, 10),
      });
    } catch (error) {
      console.error('Error fetching reading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}

// Hook to track reading time on a news page
export function useTrackReading(newsId: string | undefined) {
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const viewIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newsId) return;

    startTimeRef.current = Date.now();

    // Record view
    const recordView = async () => {
      const { data, error } = await supabase
        .from('news_views')
        .insert({
          news_id: newsId,
          user_id: user?.id || null,
          reading_time_seconds: 0,
        })
        .select('id')
        .single();

      if (!error && data) {
        viewIdRef.current = data.id;
      }
    };

    recordView();

    // Update reading time on unmount
    return () => {
      const readingTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      if (viewIdRef.current && readingTime > 0) {
        supabase
          .from('news_views')
          .update({ reading_time_seconds: readingTime })
          .eq('id', viewIdRef.current)
          .then(() => {});
      }
    };
  }, [newsId, user]);
}
