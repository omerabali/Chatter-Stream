import { useState, useEffect, useCallback } from 'react';
import { NewsItem } from '@/types/news';
import { useToast } from '@/hooks/use-toast';

const OFFLINE_NEWS_KEY = 'offlineNews';
const OFFLINE_TIMESTAMPS_KEY = 'offlineNewsTimestamps';

interface OfflineNewsData {
  news: NewsItem;
  savedAt: string;
}

export function useOfflineNews() {
  const { toast } = useToast();
  const [offlineNews, setOfflineNews] = useState<OfflineNewsData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load offline news from localStorage
  const loadOfflineNews = useCallback(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_NEWS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OfflineNewsData[];
        setOfflineNews(parsed);
      }
    } catch (error) {
      console.error('Error loading offline news:', error);
    }
  }, []);

  useEffect(() => {
    loadOfflineNews();

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Çevrimiçi',
        description: 'İnternet bağlantısı yeniden kuruldu.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Çevrimdışı',
        description: 'İnternet bağlantısı yok. Kayıtlı haberler gösteriliyor.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadOfflineNews, toast]);

  const saveForOffline = useCallback((news: NewsItem) => {
    try {
      const existing = offlineNews.find(n => n.news.id === news.id);
      if (existing) {
        toast({
          title: 'Zaten kayıtlı',
          description: 'Bu haber çevrimdışı okuma için zaten kayıtlı.',
        });
        return false;
      }

      const newData: OfflineNewsData = {
        news,
        savedAt: new Date().toISOString(),
      };

      const updated = [newData, ...offlineNews];
      localStorage.setItem(OFFLINE_NEWS_KEY, JSON.stringify(updated));
      setOfflineNews(updated);

      toast({
        title: 'Kaydedildi',
        description: 'Haber çevrimdışı okuma için kaydedildi.',
      });
      return true;
    } catch (error) {
      console.error('Error saving for offline:', error);
      toast({
        title: 'Hata',
        description: 'Haber kaydedilemedi.',
        variant: 'destructive',
      });
      return false;
    }
  }, [offlineNews, toast]);

  const removeFromOffline = useCallback((newsId: string) => {
    try {
      const updated = offlineNews.filter(n => n.news.id !== newsId);
      localStorage.setItem(OFFLINE_NEWS_KEY, JSON.stringify(updated));
      setOfflineNews(updated);

      toast({
        title: 'Kaldırıldı',
        description: 'Haber çevrimdışı listesinden kaldırıldı.',
      });
      return true;
    } catch (error) {
      console.error('Error removing from offline:', error);
      return false;
    }
  }, [offlineNews, toast]);

  const isAvailableOffline = useCallback((newsId: string) => {
    return offlineNews.some(n => n.news.id === newsId);
  }, [offlineNews]);

  const getOfflineNews = useCallback((newsId: string) => {
    return offlineNews.find(n => n.news.id === newsId)?.news;
  }, [offlineNews]);

  const clearOfflineNews = useCallback(() => {
    localStorage.removeItem(OFFLINE_NEWS_KEY);
    setOfflineNews([]);
    toast({
      title: 'Temizlendi',
      description: 'Tüm çevrimdışı haberler silindi.',
    });
  }, [toast]);

  return {
    offlineNews,
    isOnline,
    saveForOffline,
    removeFromOffline,
    isAvailableOffline,
    getOfflineNews,
    clearOfflineNews,
    refresh: loadOfflineNews,
  };
}
