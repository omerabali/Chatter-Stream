import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface EmailPreferences {
  id: string;
  user_id: string;
  daily_digest: boolean;
  breaking_news: boolean;
  favorite_categories_updates: boolean;
  last_digest_sent_at: string | null;
}

export function useEmailPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default preferences
        const { data: newData, error: insertError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            daily_digest: true,
            breaking_news: true,
            favorite_categories_updates: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as EmailPreferences);
      } else {
        setPreferences(data as EmailPreferences);
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (
    updates: Partial<Pick<EmailPreferences, 'daily_digest' | 'breaking_news' | 'favorite_categories_updates'>>
  ) => {
    if (!user || !preferences) return false;

    try {
      const { error } = await supabase
        .from('email_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Tercihler Güncellendi',
        description: 'E-posta bildirim tercihleriniz kaydedildi.',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast({
        title: 'Hata',
        description: 'Tercihler güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, preferences, toast]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
