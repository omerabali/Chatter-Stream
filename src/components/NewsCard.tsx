import { NewsItem } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { TrendingUp, TrendingDown, Minus, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { NewsInteractions } from './NewsInteractions';
import { CompareButton } from './CompareButton';
import { useNavigate } from 'react-router-dom';

interface NewsCardProps {
  news: NewsItem;
  index: number;
  isSelectedForComparison?: boolean;
  onCompareToggle?: () => void;
  comparisonDisabled?: boolean;
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="w-4 h-4" />;
    case 'negative':
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
};

const getSentimentVariant = (sentiment: string): 'success' | 'danger' | 'neutral' => {
  switch (sentiment) {
    case 'positive':
      return 'success';
    case 'negative':
      return 'danger';
    default:
      return 'neutral';
  }
};

export const NewsCard = ({
  news,
  index,
  isSelectedForComparison = false,
  onCompareToggle,
  comparisonDisabled = false
}: NewsCardProps) => {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(news.publishedAt, { addSuffix: true, locale: tr });

  const handleClick = () => {
    navigate(`/news/${news.id}`);
  };

  return (
    <article
      className={`group relative bg-[#0f172a] border rounded-sm p-0 overflow-hidden news-card-hover animate-slide-up cursor-pointer transition-all duration-300 ${isSelectedForComparison ? 'border-primary ring-1 ring-primary' : 'border-white/10 hover:border-primary/50'
        }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Card Header - Meta Data Strip */}
      <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 rounded-none border-primary/20 text-primary bg-primary/5 font-mono uppercase tracking-wider">
            {categoryLabels[news.category]}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
            {news.source}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </div>
      </div>

      <div className="p-4">
        {/* Title & Summary */}
        <div className="mb-4">
          {news.isBreaking && (
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>BREAKING NEWS</span>
            </div>
          )}
          <h3 className="text-base font-bold text-slate-100 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2 font-inter">
            {news.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {news.summary}
          </p>
        </div>

        {/* Data Visualization / Footer */}
        <div className="space-y-3">
          {/* Sentiment Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              <span>Sentiment Analysis</span>
              <span className={news.sentiment === 'positive' ? 'text-emerald-400' : news.sentiment === 'negative' ? 'text-red-400' : 'text-slate-400'}>
                {sentimentLabels[news.sentiment]} ({(news.sentimentScore * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-1000 ${news.sentiment === 'positive' ? 'bg-emerald-500' :
                    news.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'
                  }`}
                style={{ width: `${news.sentimentScore * 100}%` }}
              />
            </div>
          </div>

          {/* Tags & Interactions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {news.keywords.slice(0, 2).map(k => (
                <span key={k} className="text-[10px] text-slate-500 font-mono px-1 border border-white/5 rounded-sm">#{k}</span>
              ))}
            </div>

            {onCompareToggle && (
              <div onClick={(e) => e.stopPropagation()}>
                <CompareButton
                  news={news}
                  isSelected={isSelectedForComparison}
                  onToggle={onCompareToggle}
                  disabled={comparisonDisabled}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
