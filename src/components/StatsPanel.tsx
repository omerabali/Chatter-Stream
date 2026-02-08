import { NewsItem } from '@/types/news';
import { TrendingUp, TrendingDown, Minus, Newspaper, Activity, BarChart3 } from 'lucide-react';

interface StatsPanelProps {
  news: NewsItem[];
}

export const StatsPanel = ({ news }: StatsPanelProps) => {
  const positiveCount = news.filter(n => n.sentiment === 'positive').length;
  const negativeCount = news.filter(n => n.sentiment === 'negative').length;
  const neutralCount = news.filter(n => n.sentiment === 'neutral').length;
  const breakingCount = news.filter(n => n.isBreaking).length;

  const avgSentiment = news.reduce((acc, n) => acc + n.sentimentScore, 0) / news.length;
  const overallSentiment = avgSentiment > 0.55 ? 'positive' : avgSentiment < 0.45 ? 'negative' : 'neutral';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground font-mono">TOPLAM</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{news.length}</p>
        <p className="text-xs text-muted-foreground">Haber</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Activity className="w-5 h-5 text-destructive animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">CANLI</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{breakingCount}</p>
        <p className="text-xs text-muted-foreground">Son Dakika</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">DAĞILIM</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-sm font-semibold text-success">{positiveCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">{neutralCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <span className="text-sm font-semibold text-destructive">{negativeCount}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Duygu Dağılımı</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          {overallSentiment === 'positive' ? (
            <TrendingUp className="w-5 h-5 text-success" />
          ) : overallSentiment === 'negative' ? (
            <TrendingDown className="w-5 h-5 text-destructive" />
          ) : (
            <Minus className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground font-mono">ORTALAMA</span>
        </div>
        <p className={`text-2xl font-bold ${
          overallSentiment === 'positive' 
            ? 'text-success' 
            : overallSentiment === 'negative' 
            ? 'text-destructive' 
            : 'text-muted-foreground'
        }`}>
          {(avgSentiment * 100).toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground">Duygu Skoru</p>
      </div>
    </div>
  );
};
