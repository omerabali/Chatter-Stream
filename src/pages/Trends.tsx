import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Eye, MessageCircle, Heart, Hash, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { categoryLabels } from '@/data/mockNews';

interface TrendData {
  topNews: { id: string; title: string; views: number; likes: number; comments: number }[];
  categoryStats: { category: string; count: number }[];
  topKeywords: { keyword: string; count: number }[];
  sentimentStats: { sentiment: string; count: number }[];
}

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];

const Trends = () => {
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setIsLoading(true);

    try {
      // Fetch all news with counts
      const { data: news } = await supabase
        .from('news')
        .select('id, title, category, sentiment, keywords')
        .order('published_at', { ascending: false })
        .limit(100);

      // Fetch view counts
      const { data: views } = await supabase
        .from('news_views')
        .select('news_id');

      // Fetch likes counts
      const { data: likes } = await supabase
        .from('news_likes')
        .select('news_id');

      // Fetch comments counts
      const { data: comments } = await supabase
        .from('news_comments')
        .select('news_id');

      if (!news) {
        setData(null);
        setIsLoading(false);
        return;
      }

      // Calculate view counts per news
      const viewCounts: Record<string, number> = {};
      views?.forEach((v) => {
        viewCounts[v.news_id] = (viewCounts[v.news_id] || 0) + 1;
      });

      // Calculate like counts per news
      const likeCounts: Record<string, number> = {};
      likes?.forEach((l) => {
        likeCounts[l.news_id] = (likeCounts[l.news_id] || 0) + 1;
      });

      // Calculate comment counts per news
      const commentCounts: Record<string, number> = {};
      comments?.forEach((c) => {
        commentCounts[c.news_id] = (commentCounts[c.news_id] || 0) + 1;
      });

      // Top news by engagement
      const topNews = news
        .map((n) => ({
          id: n.id,
          title: n.title,
          views: viewCounts[n.id] || 0,
          likes: likeCounts[n.id] || 0,
          comments: commentCounts[n.id] || 0,
        }))
        .sort((a, b) => (b.views + b.likes * 2 + b.comments * 3) - (a.views + a.likes * 2 + a.comments * 3))
        .slice(0, 10);

      // Category stats
      const categoryCounts: Record<string, number> = {};
      news.forEach((n) => {
        categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
      });
      const categoryStats = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Sentiment stats
      const sentimentCounts: Record<string, number> = {};
      news.forEach((n) => {
        sentimentCounts[n.sentiment] = (sentimentCounts[n.sentiment] || 0) + 1;
      });
      const sentimentStats = Object.entries(sentimentCounts)
        .map(([sentiment, count]) => ({ sentiment, count }));

      // Top keywords
      const keywordCounts: Record<string, number> = {};
      news.forEach((n) => {
        (n.keywords || []).forEach((k: string) => {
          keywordCounts[k] = (keywordCounts[k] || 0) + 1;
        });
      });
      const topKeywords = Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      setData({ topNews, categoryStats, topKeywords, sentimentStats });
    } catch (error) {
      console.error('Error fetching trends:', error);
    }

    setIsLoading(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full px-4 py-8">
          <p className="text-center text-muted-foreground">Trend verisi bulunamadı.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Trend Analizi</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top News */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                En Popüler Haberler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topNews.map((news, index) => (
                  <div
                    key={news.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/news/${news.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm line-clamp-1">{news.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {news.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {news.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {news.comments}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Kategori Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${categoryLabels[category as keyof typeof categoryLabels] || category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="count"
                  >
                    {data.categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Duygu Analizi Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.sentimentStats}>
                  <XAxis
                    dataKey="sentiment"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    tickFormatter={(val) => val === 'positive' ? 'Olumlu' : val === 'negative' ? 'Olumsuz' : 'Nötr'}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.sentimentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSentimentColor(entry.sentiment)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Popüler Anahtar Kelimeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.topKeywords.map((kw, index) => (
                <Badge
                  key={kw.keyword}
                  variant="secondary"
                  className="text-sm py-2 px-4"
                  style={{
                    fontSize: `${Math.max(0.75, 1 + (15 - index) * 0.05)}rem`,
                  }}
                >
                  #{kw.keyword}
                  <span className="ml-2 text-muted-foreground">({kw.count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Trends;
