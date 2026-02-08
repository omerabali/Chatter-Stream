import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  email?: string;
}

interface NewsInteractionsProps {
  newsId: string;
}

export const NewsInteractions = ({ newsId }: NewsInteractionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLikesAndComments();

    // Realtime subscription
    const channel = supabase
      .channel(`news-interactions-${newsId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_likes', filter: `news_id=eq.${newsId}` }, () => {
        fetchLikes();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comments', filter: `news_id=eq.${newsId}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [newsId, user]);

  const fetchLikesAndComments = async () => {
    setIsLoading(true);
    await Promise.all([fetchLikes(), fetchComments()]);
    setIsLoading(false);
  };

  const fetchLikes = async () => {
    const { data, count } = await supabase
      .from('news_likes')
      .select('*', { count: 'exact' })
      .eq('news_id', newsId);

    setLikes(count || 0);

    if (user && data) {
      setHasLiked(data.some((like) => like.user_id === user.id));
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('news_comments')
      .select('*')
      .eq('news_id', newsId)
      .order('created_at', { ascending: false });

    if (data) {
      // Get user emails from profiles
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const commentsWithEmails = data.map((comment) => ({
        ...comment,
        email: profiles?.find((p) => p.user_id === comment.user_id)?.email || 'Anonim',
      }));

      setComments(commentsWithEmails);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Beğeni için giriş yapmanız gerekiyor.',
        variant: 'destructive',
      });
      return;
    }

    if (hasLiked) {
      await supabase.from('news_likes').delete().eq('news_id', newsId).eq('user_id', user.id);
      setHasLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      await supabase.from('news_likes').insert({ news_id: newsId, user_id: user.id });
      setHasLiked(true);
      setLikes((prev) => prev + 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Giriş yapın',
        description: 'Yorum yapmak için giriş yapmanız gerekiyor.',
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
    });

    if (error) {
      toast({
        title: 'Hata',
        description: 'Yorum eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } else {
      setNewComment('');
      toast({
        title: 'Başarılı',
        description: 'Yorumunuz eklendi.',
      });
    }
    setIsSubmitting(false);
  };

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`flex items-center gap-1.5 ${hasLiked ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
          <span className="text-xs font-mono">{likes}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleComments} className="flex items-center gap-1.5 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-mono">{comments.length}</span>
        </Button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          <form onSubmit={handleComment} className="flex gap-2">
            <Input
              placeholder="Yorum yazın..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()} className="h-8">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>

          {isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-2 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-foreground">{comment.email?.split('@')[0]}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Henüz yorum yok</p>
          )}
        </div>
      )}
    </div>
  );
};
