import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { NewsItem, DbNews, CategoryType, SentimentType } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { RealtimeComments } from '@/components/RealtimeComments';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { BookmarkButton } from '@/components/BookmarkButton';
import { OfflineNewsButton } from '@/components/OfflineNewsButton';
import { NewsTagManager } from '@/components/NewsTagManager';
import { SimilarNews } from '@/components/NewsRecommendations';
import { ReadingTimeEstimate } from '@/components/ReadingTimeEstimate';
import { DistractionFreeReader } from '@/components/DistractionFreeReader';
import { AutoTagPanel } from '@/components/AutoTagPanel';
import { useTrackReading } from '@/hooks/useReadingStats';
import { useOfflineNews } from '@/hooks/useOfflineNews';
import {
  ArrowLeft, Clock, ExternalLink, TrendingUp, TrendingDown, Minus,
  Zap, Heart, BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const mapDbNewsToNewsItem = (dbNews: DbNews): NewsItem => ({
  id: dbNews.id,
  title: dbNews.title,
  summary: dbNews.summary,
  source: dbNews.source,
  category: dbNews.category as CategoryType,
  sentiment: dbNews.sentiment as SentimentType,
  sentimentScore: Number(dbNews.sentiment_score),
  publishedAt: new Date(dbNews.published_at),
  isBreaking: dbNews.is_breaking,
  keywords: dbNews.keywords || [],
  imageUrl: dbNews.image_url || undefined,
  url: dbNews.url || undefined,
});

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return <TrendingUp className="w-5 h-5" />;
    case 'negative': return <TrendingDown className="w-5 h-5" />;
    default: return <Minus className="w-5 h-5" />;
  }
};

const getSentimentVariant = (sentiment: string): 'success' | 'danger' | 'neutral' => {
  switch (sentiment) {
    case 'positive': return 'success';
    case 'negative': return 'danger';
    default: return 'neutral';
  }
};

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, getOfflineNews } = useOfflineNews();

  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Track reading time
  useTrackReading(id);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
      fetchLikes();

      // Realtime subscription for likes only
      const channel = supabase
        .channel(`news-detail-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'news_likes', filter: `news_id=eq.${id}` }, fetchLikes)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, user]);

  const fetchNewsDetail = async () => {
    setIsLoading(true);

    // Try to get from offline cache first if we're offline
    if (!isOnline && id) {
      const offlineNewsItem = getOfflineNews(id);
      if (offlineNewsItem) {
        setNews(offlineNewsItem);
        setIsLoading(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      // Try offline cache as fallback
      if (id) {
        const offlineNewsItem = getOfflineNews(id);
        if (offlineNewsItem) {
          setNews(offlineNewsItem);
          setIsLoading(false);
          return;
        }
      }
      toast({ title: 'Hata', description: 'Haber bulunamadı.', variant: 'destructive' });
      navigate('/');
    } else {
      setNews(mapDbNewsToNewsItem(data as DbNews));
    }
    setIsLoading(false);
  };

  const fetchLikes = async () => {
    const { data, count } = await supabase
      .from('news_likes')
      .select('*', { count: 'exact' })
      .eq('news_id', id);

    setLikes(count || 0);
    if (user && data) {
      setHasLiked(data.some((like) => like.user_id === user.id));
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Giriş yapın', description: 'Beğeni için giriş yapmanız gerekiyor.', variant: 'destructive' });
      return;
    }

    if (hasLiked) {
      await supabase.from('news_likes').delete().eq('news_id', id).eq('user_id', user.id);
      setHasLiked(false);
      setLikes((prev) => prev - 1);
    } else {
      await supabase.from('news_likes').insert({ news_id: id, user_id: user.id });
      setHasLiked(true);
      setLikes((prev) => prev + 1);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-20 w-full mb-6" />
        </main>
      </div>
    );
  }

  if (!news) return null;

  const timeAgo = formatDistanceToNow(news.publishedAt, { addSuffix: true, locale: tr });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>

        {/* Hero Image */}
        {news.imageUrl && (
          <div className="relative w-full h-64 md:h-96 mb-6 rounded-xl overflow-hidden">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover"
            />
            {news.isBreaking && (
              <Badge variant="live" className="absolute top-4 left-4 flex items-center gap-1">
                <Zap className="w-4 h-4" />
                SON DAKİKA
              </Badge>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="secondary" className="font-mono">
            {categoryLabels[news.category]}
          </Badge>
          <Badge variant={getSentimentVariant(news.sentiment)} className="flex items-center gap-1">
            {getSentimentIcon(news.sentiment)}
            {sentimentLabels[news.sentiment]}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            {timeAgo}
          </div>
          <span className="text-sm text-muted-foreground">• {news.source}</span>
          <ReadingTimeEstimate text={news.summary + ' ' + news.title} />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
          {news.title}
        </h1>

        {/* Summary / Content */}
        <div className="prose prose-invert max-w-none mb-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {news.summary}
          </p>
        </div>

        {/* Read Full Article - Prominent CTA */}
        {news.url && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  📰 Haberin Devamını Oku
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bu haber özeti {news.source} kaynağından alınmıştır. Tam içerik için orijinal kaynağa gidin.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsReaderOpen(true)}
                  className="flex-1 sm:flex-initial"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Odak Modu
                </Button>
                <Button
                  onClick={() => window.open(news.url, '_blank')}
                  className="flex-1 sm:flex-initial"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Kaynağa Git
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sentiment Score */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Duygu Analizi
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${news.sentiment === 'positive' ? 'bg-success' :
                      news.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted-foreground'
                    }`}
                  style={{ width: `${news.sentimentScore * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xl font-mono font-bold">
              {(news.sentimentScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mb-8">
          {news.keywords.map((keyword) => (
            <span key={keyword} className="text-sm px-3 py-1 bg-muted rounded-full text-muted-foreground font-mono">
              #{keyword}
            </span>
          ))}
        </div>

        {/* Tags */}
        <div className="mb-6">
          <NewsTagManager newsId={news.id} />
        </div>

        {/* AI Auto-Tagging */}
        <div className="mb-6">
          <AutoTagPanel news={news} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-border">
          <Button
            variant={hasLiked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            className={hasLiked ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            <Heart className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
            {likes} Beğeni
          </Button>

          <BookmarkButton newsId={news.id} />

          <OfflineNewsButton news={news} variant="full" />

          <SocialShareButtons
            title={news.title}
            summary={news.summary}
            url={window.location.href}
          />

          {news.url && (
            <Button variant="outline" size="sm" onClick={() => window.open(news.url, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Kaynağa Git
            </Button>
          )}
        </div>

        {/* Similar News */}
        <div className="mb-8">
          <SimilarNews newsId={news.id} />
        </div>

        {/* Comments Section - Using RealtimeComments */}
        <RealtimeComments newsId={news.id} />
      </main>

      {/* Distraction-Free Reader */}
      <DistractionFreeReader
        news={news}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </div>
  );
};

export default NewsDetail;
