import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  id: string;
  user_id: string;
  favorite_categories: string[];
  favorite_keywords: string[];
  favorite_sources: string[];
  created_at: string;
  updated_at: string;
}

interface PreferencesUpdate {
  favorite_categories?: string[];
  favorite_keywords?: string[];
  favorite_sources?: string[];
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
    } else {
      setPreferences(data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: PreferencesUpdate) => {
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Tercihlerinizi kaydetmek için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    const updateData: Record<string, string[]> = {};
    if (updates.favorite_categories !== undefined) {
      updateData.favorite_categories = updates.favorite_categories;
    }
    if (updates.favorite_keywords !== undefined) {
      updateData.favorite_keywords = updates.favorite_keywords;
    }
    if (updates.favorite_sources !== undefined) {
      updateData.favorite_sources = updates.favorite_sources;
    }

    if (preferences) {
      const { error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Hata',
          description: 'Tercihler kaydedilemedi.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }
    } else {
      const { error } = await supabase.from('user_preferences').insert({
        user_id: user.id,
        favorite_categories: updates.favorite_categories || [],
        favorite_keywords: updates.favorite_keywords || [],
        favorite_sources: updates.favorite_sources || [],
      });

      if (error) {
        toast({
          title: 'Hata',
          description: 'Tercihler kaydedilemedi.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return false;
      }
    }

    toast({
      title: 'Başarılı',
      description: 'Tercihleriniz kaydedildi.',
    });

    await fetchPreferences();
    setIsLoading(false);
    return true;
  };

  const toggleCategory = async (category: string) => {
    const currentCategories = preferences?.favorite_categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    return updatePreferences({ favorite_categories: newCategories });
  };

  const addKeyword = async (keyword: string) => {
    const currentKeywords = preferences?.favorite_keywords || [];
    if (currentKeywords.includes(keyword)) return true;

    return updatePreferences({ favorite_keywords: [...currentKeywords, keyword] });
  };

  const removeKeyword = async (keyword: string) => {
    const currentKeywords = preferences?.favorite_keywords || [];
    return updatePreferences({ favorite_keywords: currentKeywords.filter((k) => k !== keyword) });
  };

  const toggleSource = async (source: string) => {
    const currentSources = preferences?.favorite_sources || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source];

    return updatePreferences({ favorite_sources: newSources });
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    toggleCategory,
    addKeyword,
    removeKeyword,
    toggleSource,
    refetch: fetchPreferences,
  };
}
