import { useState, useCallback } from 'react';
import { NewsItem } from '@/types/news';
import { useToast } from '@/hooks/use-toast';
import { useNewsTags } from '@/hooks/useNewsTags';
import { useAuth } from '@/hooks/useAuth';

export interface SuggestedTag {
  name: string;
  color: string;
  reason: string;
}

export interface AutoTagResult {
  suggested_tags: SuggestedTag[];
  topic_summary: string;
  related_topics: string[];
}

export function useAutoTagging() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createTag, assignTag, tags } = useNewsTags();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AutoTagResult | null>(null);

  const analyzeNews = useCallback(async (news: NewsItem): Promise<AutoTagResult | null> => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Otomatik etiketleme için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return null;
    }

    setIsAnalyzing(true);
    setSuggestions(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-tag-news`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            title: news.title,
            summary: news.summary,
            keywords: news.keywords,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit aşıldı. Lütfen daha sonra tekrar deneyin.');
        }
        if (response.status === 402) {
          throw new Error('Kredi yetersiz. Lütfen kredi ekleyin.');
        }
        throw new Error('AI analizi başarısız oldu');
      }

      const result = await response.json() as AutoTagResult;
      setSuggestions(result);
      
      return result;
    } catch (error) {
      console.error('Auto-tagging failed:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Otomatik etiketleme başarısız oldu.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  const applyTag = useCallback(async (newsId: string, tagName: string, color: string) => {
    if (!user) return;

    // Check if tag already exists
    const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    
    let tagId: string;
    
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      // Create new tag
      const newTag = await createTag(tagName, color);
      if (!newTag) {
        toast({
          title: 'Hata',
          description: 'Etiket oluşturulamadı.',
          variant: 'destructive',
        });
        return;
      }
      tagId = newTag.id;
    }

    // Assign tag to news
    const success = await assignTag(newsId, tagId);
    if (success) {
      toast({
        title: 'Etiket Eklendi',
        description: `"${tagName}" etiketi habere eklendi.`,
      });
    }
  }, [user, tags, createTag, assignTag, toast]);

  const applyAllSuggestions = useCallback(async (newsId: string) => {
    if (!suggestions || !user) return;

    for (const tag of suggestions.suggested_tags) {
      await applyTag(newsId, tag.name, tag.color);
    }

    toast({
      title: 'Tüm Etiketler Eklendi',
      description: `${suggestions.suggested_tags.length} etiket habere eklendi.`,
    });
  }, [suggestions, user, applyTag, toast]);

  return {
    isAnalyzing,
    suggestions,
    analyzeNews,
    applyTag,
    applyAllSuggestions,
    clearSuggestions: () => setSuggestions(null),
  };
}
