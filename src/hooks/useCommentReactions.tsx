import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function useCommentReactions(commentIds: string[]) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Record<string, CommentReaction[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    if (commentIds.length === 0) {
      setReactions({});
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('*')
        .in('comment_id', commentIds);

      if (error) throw error;

      // Group by comment_id
      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.comment_id]) {
          acc[reaction.comment_id] = [];
        }
        acc[reaction.comment_id].push(reaction as CommentReaction);
        return acc;
      }, {} as Record<string, CommentReaction[]>);

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [commentIds.join(',')]);

  useEffect(() => {
    fetchReactions();

    // Subscribe to realtime updates
    if (commentIds.length > 0) {
      const channel = supabase
        .channel('comment-reactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comment_reactions',
          },
          () => {
            fetchReactions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchReactions, commentIds.length]);

  const toggleReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!user) {
      toast({
        title: 'Giriş Yapın',
        description: 'Reaksiyon eklemek için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return;
    }

    const existingReaction = reactions[commentId]?.find(
      r => r.user_id === user.id && r.emoji === emoji
    );

    try {
      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;

        setReactions(prev => ({
          ...prev,
          [commentId]: prev[commentId]?.filter(r => r.id !== existingReaction.id) || [],
        }));
      } else {
        // Add reaction
        const { data, error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            emoji,
          })
          .select()
          .single();

        if (error) throw error;

        setReactions(prev => ({
          ...prev,
          [commentId]: [...(prev[commentId] || []), data as CommentReaction],
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: 'Hata',
        description: 'Reaksiyon eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  }, [user, reactions, toast]);

  const getReactionCounts = useCallback((commentId: string): ReactionCount[] => {
    const commentReactions = reactions[commentId] || [];
    const counts: Record<string, ReactionCount> = {};

    for (const reaction of commentReactions) {
      if (!counts[reaction.emoji]) {
        counts[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          hasReacted: false,
        };
      }
      counts[reaction.emoji].count++;
      if (user && reaction.user_id === user.id) {
        counts[reaction.emoji].hasReacted = true;
      }
    }

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [reactions, user]);

  return {
    reactions,
    isLoading,
    toggleReaction,
    getReactionCounts,
    refetch: fetchReactions,
  };
}
