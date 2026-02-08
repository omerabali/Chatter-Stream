import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NewsNotification {
  id: string;
  title: string;
  isBreaking: boolean;
  createdAt: Date;
  read: boolean;
}

export function useNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NewsNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string, newsId?: string) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: newsId || 'news-notification',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      if (newsId) {
        window.location.href = `/news/${newsId}`;
      }
      notification.close();
    };
  }, [permission]);

  // Add notification to state
  const addNotification = useCallback((news: { id: string; title: string; is_breaking?: boolean }) => {
    const newNotification: NewsNotification = {
      id: news.id,
      title: news.title,
      isBreaking: news.is_breaking || false,
      createdAt: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]);

    // Show toast notification
    if (news.is_breaking) {
      toast({
        title: '🔴 SON DAKİKA',
        description: news.title,
        duration: 10000,
      });
      showBrowserNotification('🔴 SON DAKİKA', news.title, news.id);
    } else {
      toast({
        title: '📰 Yeni Haber',
        description: news.title,
        duration: 5000,
      });
    }
  }, [toast, showBrowserNotification]);

  // Listen for new breaking news
  useEffect(() => {
    const channel = supabase
      .channel('breaking-news-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news',
        },
        (payload) => {
          const news = payload.new as { id: string; title: string; is_breaking: boolean };
          if (news.is_breaking) {
            addNotification(news);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Clear all notifications
  const clearAll = () => setNotifications([]);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    clearAll,
    addNotification,
  };
}
