import { useState, useEffect } from 'react';
import { NewsItem } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReadingTimeEstimate } from '@/components/ReadingTimeEstimate';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { 
  X, Minus, Plus, Sun, Moon, ExternalLink, 
  TrendingUp, TrendingDown 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DistractionFreeReaderProps {
  news: NewsItem;
  isOpen: boolean;
  onClose: () => void;
}

export function DistractionFreeReader({ news, isOpen, onClose }: DistractionFreeReaderProps) {
  const [fontSize, setFontSize] = useState(18);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight - target.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    const reader = document.getElementById('distraction-free-reader');
    if (reader) {
      reader.addEventListener('scroll', handleScroll);
      return () => reader.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  const timeAgo = formatDistanceToNow(news.publishedAt, { addSuffix: true, locale: tr });

  return (
    <div 
      className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}
    >
      {/* Reading Progress */}
      <Progress value={scrollProgress} className="fixed top-0 left-0 right-0 h-1 rounded-none z-10" />

      {/* Top Bar */}
      <div className={`fixed top-1 left-0 right-0 z-10 ${isDarkMode ? 'bg-zinc-900/90' : 'bg-zinc-50/90'} backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}
            >
              <X className="w-5 h-5" />
            </Button>
            <ReadingTimeEstimate text={news.summary + ' ' + news.title} />
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className={isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className={`text-sm font-mono w-8 text-center ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {fontSize}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              className={isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        id="distraction-free-reader"
        className="h-full overflow-y-auto pt-20 pb-24"
      >
        <article className="container mx-auto px-4 max-w-2xl">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="font-mono">
              {categoryLabels[news.category]}
            </Badge>
            <Badge 
              variant={news.sentiment === 'positive' ? 'success' : news.sentiment === 'negative' ? 'danger' : 'neutral'}
              className="flex items-center gap-1"
            >
              {getSentimentIcon(news.sentiment)}
              {sentimentLabels[news.sentiment]}
            </Badge>
            <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {timeAgo} • {news.source}
            </span>
          </div>

          {/* Title */}
          <h1 
            className={`font-bold mb-8 leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            style={{ fontSize: `${fontSize + 8}px` }}
          >
            {news.title}
          </h1>

          {/* Image */}
          {news.imageUrl && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={news.imageUrl} 
                alt={news.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Summary */}
          <div 
            className={`leading-relaxed mb-8 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            <p>{news.summary}</p>
          </div>

          {/* Full Article Link */}
          {news.url && (
            <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                📰 Bu haber özeti harici bir kaynaktan alınmıştır. Haberin tam içeriğini okumak için:
              </p>
              <Button 
                onClick={() => window.open(news.url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Haberin Devamını Oku ({news.source})
              </Button>
            </div>
          )}

          {/* Keywords */}
          {news.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {news.keywords.map((keyword) => (
                <span 
                  key={keyword} 
                  className={`text-sm px-3 py-1 rounded-full font-mono ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                  }`}
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
