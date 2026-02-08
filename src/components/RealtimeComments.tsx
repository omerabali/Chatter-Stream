import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCommentReactions } from '@/hooks/useCommentReactions';
import { CommentReactions } from '@/components/CommentReactions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Loader2, Bell, Reply, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  news_id: string;
  parent_id: string | null;
  email?: string;
  replies?: Comment[];
}

interface RealtimeCommentsProps {
  newsId: string;
}

export const RealtimeComments = ({ newsId }: RealtimeCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [newCommentNotif, setNewCommentNotif] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all comment IDs for reactions
  const allCommentIds = useMemo(() => {
    const ids: string[] = [];
    comments.forEach(c => {
      ids.push(c.id);
      c.replies?.forEach(r => ids.push(r.id));
    });
    return ids;
  }, [comments]);

  const { toggleReaction, getReactionCounts } = useCommentReactions(allCommentIds);

  useEffect(() => {
    fetchComments();

    // Setup realtime subscription
    const channel = supabase
      .channel(`realtime-comments-${newsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_comments',
          filter: `news_id=eq.${newsId}`,
        },
        async (payload) => {
          const newCommentData = payload.new as Comment;
          
          // Fetch email for the new comment
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', newCommentData.user_id)
            .maybeSingle();

          const commentWithEmail = {
            ...newCommentData,
            email: profile?.email || 'Anonim',
          };

          if (newCommentData.parent_id) {
            // It's a reply - add to parent's replies
            setComments((prev) => prev.map(c => {
              if (c.id === newCommentData.parent_id) {
                return {
                  ...c,
                  replies: [commentWithEmail, ...(c.replies || [])],
                };
              }
              return c;
            }));
            setExpandedReplies(prev => new Set([...prev, newCommentData.parent_id!]));
          } else {
            // It's a top-level comment
            setComments((prev) => [commentWithEmail, ...prev]);
          }
          
          // Show notification if it's not from current user
          if (newCommentData.user_id !== user?.id) {
            setNewCommentNotif(true);
            toast({
              title: '💬 Yeni Yorum',
              description: `${commentWithEmail.email?.split('@')[0]}: ${newCommentData.content.substring(0, 50)}...`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'news_comments',
          filter: `news_id=eq.${newsId}`,
        },
        (payload) => {
          const deletedId = (payload.old as Comment).id;
          setComments((prev) => {
            // Check if it's a top-level comment
            const filtered = prev.filter((c) => c.id !== deletedId);
            // Also remove from replies
            return filtered.map(c => ({
              ...c,
              replies: c.replies?.filter(r => r.id !== deletedId),
            }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [newsId, user?.id, toast]);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('news_comments')
      .select('*')
      .eq('news_id', newsId)
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const commentsWithEmails = data.map((comment) => ({
        ...comment,
        email: profiles?.find((p) => p.user_id === comment.user_id)?.email || 'Anonim',
      })) as Comment[];

      // Organize into parent/child structure
      const topLevel: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      commentsWithEmails.forEach(comment => {
        if (comment.parent_id) {
          if (!repliesMap[comment.parent_id]) {
            repliesMap[comment.parent_id] = [];
          }
          repliesMap[comment.parent_id].push(comment);
        } else {
          topLevel.push(comment);
        }
      });

      // Attach replies to parents
      topLevel.forEach(comment => {
        comment.replies = repliesMap[comment.id] || [];
      });

      setComments(topLevel);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Yorum yapmak için giriş yapmalısınız.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('news_comments').insert({
      news_id: newsId,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: replyTo?.id || null,
    });

    if (error) {
      toast({
        title: 'Hata',
        description: 'Yorum eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } else {
      setNewComment('');
      setReplyTo(null);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('news_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Hata',
        description: 'Yorum silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`bg-card border border-border rounded-lg p-4 animate-fade-in ${isReply ? 'ml-8 mt-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{comment.email?.split('@')[0]}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
          {user?.id === comment.user_id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground mb-3">{comment.content}</p>
      
      {/* Actions row */}
      <div className="flex items-center justify-between">
        <CommentReactions
          commentId={comment.id}
          reactionCounts={getReactionCounts(comment.id)}
          onToggleReaction={toggleReaction}
        />
        
        <div className="flex items-center gap-2">
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => startReply(comment)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Yanıtla
            </Button>
          )}
          
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleReplies(comment.id)}
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Yanıtları Gizle
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  {comment.replies.length} Yanıt
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Replies */}
      {!isReply && expandedReplies.has(comment.id) && comment.replies && (
        <div className="mt-3 space-y-2">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Canlı Yorumlar ({comments.length})
        </h2>
        {newCommentNotif && (
          <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
            <Bell className="w-4 h-4" />
            Yeni yorumlar!
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
          <span className="text-sm text-muted-foreground">
            <Reply className="w-4 h-4 inline mr-1" />
            {replyTo.email?.split('@')[0]}'a yanıt veriyorsun
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyTo(null)}
          >
            İptal
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          ref={inputRef}
          placeholder={replyTo ? "Yanıtınızı yazın..." : "Yorumunuzu yazın..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
          onFocus={() => setNewCommentNotif(false)}
        />
        <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      ) : (
        <div className="space-y-4" ref={commentsEndRef}>
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};
