import { useState } from 'react';
import { ComparisonGroup } from '@/hooks/useNewsComparison';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { 
  Layers, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, 
  ExternalLink, Scale 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { NewsItem } from '@/types/news';

interface NewsGroupCardProps {
  group: ComparisonGroup;
  onCompare: (news: NewsItem[]) => void;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return <TrendingUp className="w-3 h-3" />;
    case 'negative': return <TrendingDown className="w-3 h-3" />;
    default: return <Minus className="w-3 h-3" />;
  }
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'text-success';
    case 'negative': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export function NewsGroupCard({ group, onCompare }: NewsGroupCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const sources = [...new Set(group.news.map(n => n.source))];
  const avgSentiment = group.news.reduce((sum, n) => sum + n.sentimentScore, 0) / group.news.length;

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm line-clamp-1">{group.topic}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {group.news.length} kaynak
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Keywords */}
        <div className="flex flex-wrap gap-1">
          {group.keywords.slice(0, 3).map(keyword => (
            <span 
              key={keyword} 
              className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
            >
              #{keyword}
            </span>
          ))}
        </div>

        {/* Sources */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Kaynaklar:</span> {sources.join(', ')}
        </div>

        {/* Avg Sentiment */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                avgSentiment > 0.6 ? 'bg-success' : 
                avgSentiment < 0.4 ? 'bg-destructive' : 'bg-muted-foreground'
              }`}
              style={{ width: `${avgSentiment * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold">
            {(avgSentiment * 100).toFixed(0)}%
          </span>
        </div>

        {/* News Preview */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-border animate-fade-in">
            {group.news.map((news) => (
              <div 
                key={news.id} 
                className="p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => navigate(`/news/${news.id}`)}
              >
                <p className="text-xs font-medium line-clamp-2 mb-1">{news.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={getSentimentColor(news.sentiment)}>
                    {getSentimentIcon(news.sentiment)}
                  </span>
                  <span>{news.source}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(news.publishedAt, { locale: tr })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Daralt' : 'Genişlet'}
            <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onCompare(group.news)}
          >
            <Scale className="w-3 h-3 mr-1" />
            Karşılaştır
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
