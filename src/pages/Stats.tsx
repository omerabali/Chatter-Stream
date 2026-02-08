import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { categoryLabels } from '@/data/mockNews';
import {
  BarChart3, Eye, MessageSquare, Heart, TrendingUp,
  Loader2, Calendar, Award, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NewsStats {
  id: string;
  title: string;
  category: string;
  source: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

interface DailyStats {
  date: string;
  views: number;
  likes: number;
  comments: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))',
  '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4'];

const Stats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [topViewedNews, setTopViewedNews] = useState<NewsStats[]>([]);
  const [topCommentedNews, setTopCommentedNews] = useState<NewsStats[]>([]);
  const [topLikedNews, setTopLikedNews] = useState<NewsStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; value: number }[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalStats, setTotalStats] = useState({ views: 0, likes: 0, comments: 0, news: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch all news with their stats
      const { data: newsData } = await supabase
        .from('news')
        .select('id, title, category, source, published_at');

      const { data: viewsData } = await supabase
        .from('news_views')
        .select('news_id, viewed_at');

      const { data: likesData } = await supabase
        .from('news_likes')
        .select('news_id, created_at');

      const { data: commentsData } = await supabase
        .from('news_comments')
        .select('news_id, created_at');

      if (!newsData) return;

      // Aggregate stats per news
      const newsStatsMap = new Map<string, NewsStats>();

      newsData.forEach(news => {
        newsStatsMap.set(news.id, {
          id: news.id,
          title: news.title,
          category: news.category,
          source: news.source,
          published_at: news.published_at,
          view_count: 0,
          like_count: 0,
          comment_count: 0
        });
      });

      viewsData?.forEach(view => {
        const stats = newsStatsMap.get(view.news_id);
        if (stats) stats.view_count++;
      });

      likesData?.forEach(like => {
        const stats = newsStatsMap.get(like.news_id);
        if (stats) stats.like_count++;
      });

      commentsData?.forEach(comment => {
        const stats = newsStatsMap.get(comment.news_id);
        if (stats) stats.comment_count++;
      });

      const allStats = Array.from(newsStatsMap.values());

      // Top viewed
      setTopViewedNews(
        [...allStats].sort((a, b) => b.view_count - a.view_count).slice(0, 10)
      );

      // Top commented
      setTopCommentedNews(
        [...allStats].sort((a, b) => b.comment_count - a.comment_count).slice(0, 10)
      );

      // Top liked
      setTopLikedNews(
        [...allStats].sort((a, b) => b.like_count - a.like_count).slice(0, 10)
      );

      // Category stats
      const catCounts: Record<string, number> = {};
      allStats.forEach(news => {
        catCounts[news.category] = (catCounts[news.category] || 0) + 1;
      });
      setCategoryStats(
        Object.entries(catCounts)
          .map(([name, value]) => ({ name: categoryLabels[name as keyof typeof categoryLabels] || name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Daily stats (last 7 days)
      const dailyMap: Record<string, DailyStats> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap[date] = { date, views: 0, likes: 0, comments: 0 };
      }

      viewsData?.forEach(view => {
        const date = format(new Date(view.viewed_at), 'yyyy-MM-dd');
        if (dailyMap[date]) dailyMap[date].views++;
      });

      likesData?.forEach(like => {
        const date = format(new Date(like.created_at), 'yyyy-MM-dd');
        if (dailyMap[date]) dailyMap[date].likes++;
      });

      commentsData?.forEach(comment => {
        const date = format(new Date(comment.created_at), 'yyyy-MM-dd');
        if (dailyMap[date]) dailyMap[date].comments++;
      });

      setDailyStats(Object.values(dailyMap));

      // Totals
      setTotalStats({
        views: viewsData?.length || 0,
        likes: likesData?.length || 0,
        comments: commentsData?.length || 0,
        news: newsData.length
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full px-4 py-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <Header />

      <main className="w-full px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">İstatistikler</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.news}</p>
                  <p className="text-xs text-muted-foreground">Toplam Haber</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.views}</p>
                  <p className="text-xs text-muted-foreground">Görüntülenme</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.likes}</p>
                  <p className="text-xs text-muted-foreground">Beğeni</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.comments}</p>
                  <p className="text-xs text-muted-foreground">Yorum</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Son 7 Gün Aktivite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(v) => format(new Date(v), 'dd MMM', { locale: tr })}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(v) => format(new Date(v), 'dd MMMM yyyy', { locale: tr })}
                  />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} name="Görüntülenme" />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} name="Beğeni" />
                  <Line type="monotone" dataKey="comments" stroke="#22c55e" strokeWidth={2} name="Yorum" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Kategori Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryStats.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryStats.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Lists */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Top Viewed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                En Çok Okunan
              </CardTitle>
              <CardDescription>Görüntülenme sayısına göre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topViewedNews.slice(0, 5).map((news, index) => (
                  <div key={news.id} className="flex items-start gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Eye className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{news.view_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Commented */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                En Çok Yorum Alan
              </CardTitle>
              <CardDescription>Yorum sayısına göre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCommentedNews.slice(0, 5).map((news, index) => (
                  <div key={news.id} className="flex items-start gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{news.comment_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Liked */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                En Çok Beğenilen
              </CardTitle>
              <CardDescription>Beğeni sayısına göre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLikedNews.slice(0, 5).map((news, index) => (
                  <div key={news.id} className="flex items-start gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Heart className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{news.like_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Stats;
