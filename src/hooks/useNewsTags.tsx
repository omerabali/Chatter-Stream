import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface TagAssignment {
  id: string;
  news_id: string;
  tag_id: string;
}

export function useNewsTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [assignments, setAssignments] = useState<TagAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([]);
      setAssignments([]);
      return;
    }

    setIsLoading(true);
    try {
      const [tagsResponse, assignmentsResponse] = await Promise.all([
        supabase
          .from('user_news_tags')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('news_tag_assignments')
          .select('id, news_id, tag_id')
          .eq('user_id', user.id),
      ]);

      if (tagsResponse.error) throw tagsResponse.error;
      if (assignmentsResponse.error) throw assignmentsResponse.error;

      setTags(tagsResponse.data || []);
      setAssignments(assignmentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = async (name: string, color: string = '#f59e0b') => {
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Etiket oluşturmak için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: 'Hata',
        description: 'Etiket adı boş olamaz.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_news_tags')
        .insert({ user_id: user.id, name: trimmedName, color })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Hata',
            description: 'Bu isimde bir etiket zaten var.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return null;
      }

      setTags([...tags, data]);
      toast({
        title: 'Başarılı',
        description: `"${trimmedName}" etiketi oluşturuldu.`,
      });
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Hata',
        description: 'Etiket oluşturulamadı.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTag = async (tagId: string, name: string, color: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_news_tags')
        .update({ name: name.trim(), color })
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTags(tags.map(t => t.id === tagId ? { ...t, name: name.trim(), color } : t));
      toast({
        title: 'Başarılı',
        description: 'Etiket güncellendi.',
      });
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Hata',
        description: 'Etiket güncellenemedi.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_news_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTags(tags.filter(t => t.id !== tagId));
      setAssignments(assignments.filter(a => a.tag_id !== tagId));
      toast({
        title: 'Başarılı',
        description: 'Etiket silindi.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Hata',
        description: 'Etiket silinemedi.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const assignTag = async (newsId: string, tagId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('news_tag_assignments')
        .insert({ user_id: user.id, news_id: newsId, tag_id: tagId })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already assigned
          return true;
        }
        throw error;
      }

      setAssignments([...assignments, data]);
      return true;
    } catch (error) {
      console.error('Error assigning tag:', error);
      toast({
        title: 'Hata',
        description: 'Etiket atanamadı.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeTagFromNews = async (newsId: string, tagId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('news_tag_assignments')
        .delete()
        .eq('user_id', user.id)
        .eq('news_id', newsId)
        .eq('tag_id', tagId);

      if (error) throw error;

      setAssignments(assignments.filter(a => !(a.news_id === newsId && a.tag_id === tagId)));
      return true;
    } catch (error) {
      console.error('Error removing tag:', error);
      return false;
    }
  };

  const getTagsForNews = useCallback((newsId: string) => {
    const tagIds = assignments.filter(a => a.news_id === newsId).map(a => a.tag_id);
    return tags.filter(t => tagIds.includes(t.id));
  }, [tags, assignments]);

  const getNewsIdsForTag = useCallback((tagId: string) => {
    return assignments.filter(a => a.tag_id === tagId).map(a => a.news_id);
  }, [assignments]);

  return {
    tags,
    assignments,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
    assignTag,
    removeTagFromNews,
    getTagsForNews,
    getNewsIdsForTag,
    refetch: fetchTags,
  };
}
