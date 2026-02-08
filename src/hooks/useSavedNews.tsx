import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SavedNews {
  id: string;
  news_id: string;
  created_at: string;
}

export function useSavedNews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedNews, setSavedNews] = useState<SavedNews[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSavedNews = useCallback(async () => {
    if (!user) {
      setSavedNews([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_news')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved news:', error);
    } else {
      setSavedNews(data || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSavedNews();
  }, [fetchSavedNews]);

  const isSaved = useCallback((newsId: string) => {
    return savedNews.some((s) => s.news_id === newsId);
  }, [savedNews]);

  const toggleSave = async (newsId: string) => {
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Haberleri kaydetmek için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return false;
    }

    const existing = savedNews.find((s) => s.news_id === newsId);

    if (existing) {
      const { error } = await supabase
        .from('saved_news')
        .delete()
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Hata', description: 'İşlem başarısız.', variant: 'destructive' });
        return false;
      }

      setSavedNews(savedNews.filter((s) => s.id !== existing.id));
      toast({ title: 'Kaldırıldı', description: 'Haber kaydedilenlerden çıkarıldı.' });
    } else {
      const { data, error } = await supabase
        .from('saved_news')
        .insert({ user_id: user.id, news_id: newsId })
        .select()
        .single();

      if (error) {
        toast({ title: 'Hata', description: 'İşlem başarısız.', variant: 'destructive' });
        return false;
      }

      setSavedNews([data, ...savedNews]);
      toast({ title: 'Kaydedildi', description: 'Haber kaydedildi.' });
    }

    return true;
  };

  return {
    savedNews,
    isLoading,
    isSaved,
    toggleSave,
    refetch: fetchSavedNews,
  };
}
