import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReadingStats } from '@/hooks/useReadingStats';
import { useAuth } from '@/hooks/useAuth';
import { categoryLabels } from '@/data/mockNews';
import { BarChart3, Clock, Eye, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const ReadingStatsCard = () => {
  const { user } = useAuth();
  const { stats, isLoading } = useReadingStats();

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Okuma İstatistikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            İstatistiklerinizi görmek için giriş yapın.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Okuma İstatistikleri
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika`;
    return `${Math.floor(seconds / 3600)} saat ${Math.floor((seconds % 3600) / 60)} dakika`;
  };

  const maxCount = stats?.categoryStats[0]?.count || 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Okuma İstatistikleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
            <p className="text-xs text-muted-foreground">Toplam Görüntüleme</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {stats?.totalReadingTime ? formatTime(stats.totalReadingTime) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">Okuma Süresi</p>
          </div>
        </div>

        {/* Category Stats */}
        {stats?.categoryStats && stats.categoryStats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">En Çok Okunan Kategoriler</h4>
            <div className="space-y-3">
              {stats.categoryStats.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {categoryLabels[cat.category as keyof typeof categoryLabels] || cat.category}
                    </span>
                    <span className="font-medium">{cat.count}</span>
                  </div>
                  <Progress value={(cat.count / maxCount) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(!stats?.categoryStats || stats.categoryStats.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-4">
            Henüz okuma geçmişiniz yok.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
