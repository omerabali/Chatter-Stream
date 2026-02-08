import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    checkSubscription();
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user]);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Desteklenmiyor',
        description: 'Tarayıcınız bildirimleri desteklemiyor.',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast({
        title: 'İzin Reddedildi',
        description: 'Bildirim izni verilmedi.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const subscribe = async () => {
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Bildirimlere abone olmak için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll use a mock subscription
      // In production, you'd need VAPID keys and a push server
      const mockSubscription = {
        endpoint: `https://fcm.googleapis.com/fcm/send/${user.id}-${Date.now()}`,
        keys: {
          p256dh: 'mock-p256dh-key',
          auth: 'mock-auth-key',
        },
      };

      // Save to database
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Başarılı',
        description: 'Bildirimler etkinleştirildi.',
      });

      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Hata',
        description: 'Bildirimler etkinleştirilemedi.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(false);
      toast({
        title: 'Başarılı',
        description: 'Bildirimler devre dışı bırakıldı.',
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Hata',
        description: 'İşlem başarısız.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  };

  // Send local notification (for demo)
  const sendLocalNotification = (title: string, body: string) => {
    if (isSupported && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    toggleSubscription,
    sendLocalNotification,
  };
}
