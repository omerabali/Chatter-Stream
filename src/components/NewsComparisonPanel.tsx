import { useState } from 'react';
import { NewsItem } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { 
  Scale, X, TrendingUp, TrendingDown, Minus, Clock, 
  ExternalLink, ChevronDown, ChevronUp 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NewsComparisonPanelProps {
  selectedNews: NewsItem[];
  onRemove: (newsId: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return <TrendingUp className="w-4 h-4" />;
    case 'negative': return <TrendingDown className="w-4 h-4" />;
    default: return <Minus className="w-4 h-4" />;
  }
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'text-success';
    case 'negative': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export function NewsComparisonPanel({ 
  selectedNews, 
  onRemove, 
  onClear, 
  isOpen, 
  onClose 
}: NewsComparisonPanelProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen || selectedNews.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Haber Karşılaştırması</h2>
            <Badge variant="secondary">{selectedNews.length} haber</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              Temizle
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {selectedNews.map((news) => (
            <Card key={news.id} className="relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => onRemove(news.id)}
              >
                <X className="w-3 h-3" />
              </Button>

              <CardHeader className="pb-2">
                {news.imageUrl && (
                  <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
                    <img 
                      src={news.imageUrl} 
                      alt={news.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="text-sm line-clamp-3">{news.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[news.category]}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs flex items-center gap-1 ${getSentimentColor(news.sentiment)}`}
                  >
                    {getSentimentIcon(news.sentiment)}
                    {sentimentLabels[news.sentiment]}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(news.publishedAt, { addSuffix: true, locale: tr })}
                  </div>
                  <div className="font-medium">{news.source}</div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Duygu Skoru</span>
                    <span className="font-mono font-bold">
                      {(news.sentimentScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        news.sentiment === 'positive' ? 'bg-success' : 
                        news.sentiment === 'negative' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${news.sentimentScore * 100}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setExpandedId(expandedId === news.id ? null : news.id)}
                >
                  {expandedId === news.id ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" /> Daralt
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" /> Özeti Gör
                    </>
                  )}
                </Button>

                {expandedId === news.id && (
                  <p className="text-xs text-muted-foreground leading-relaxed animate-fade-in">
                    {news.summary}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => navigate(`/news/${news.id}`)}
                  >
                    Detay
                  </Button>
                  {news.url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => window.open(news.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Karşılaştırma Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Kaynak Sayısı</p>
                <p className="text-2xl font-bold font-mono">
                  {new Set(selectedNews.map(n => n.source)).size}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Ort. Duygu Skoru</p>
                <p className="text-2xl font-bold font-mono">
                  {(selectedNews.reduce((sum, n) => sum + n.sentimentScore, 0) / selectedNews.length * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Pozitif</p>
                <p className="text-2xl font-bold font-mono text-success">
                  {selectedNews.filter(n => n.sentiment === 'positive').length}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Negatif</p>
                <p className="text-2xl font-bold font-mono text-destructive">
                  {selectedNews.filter(n => n.sentiment === 'negative').length}
                </p>
              </div>
            </div>

            {/* Common Keywords */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Ortak Anahtar Kelimeler</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const allKeywords = selectedNews.flatMap(n => n.keywords);
                  const keywordCounts = allKeywords.reduce((acc, k) => {
                    acc[k.toLowerCase()] = (acc[k.toLowerCase()] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  return Object.entries(keywordCounts)
                    .filter(([_, count]) => count > 1)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([keyword, count]) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        #{keyword} ({count})
                      </Badge>
                    ));
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
