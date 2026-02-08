import { NewsFilter as FilterType, CategoryType, SentimentType } from '@/types/news';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { Search, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NewsFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const categories: (CategoryType | 'all')[] = ['all', 'politics', 'economy', 'technology', 'sports', 'health', 'world', 'entertainment', 'education', 'science', 'environment', 'automotive', 'crypto', 'finance', 'realestate', 'agriculture', 'crime'];
const sentiments: (SentimentType | 'all')[] = ['all', 'positive', 'neutral', 'negative'];

const getCategoryLabel = (cat: CategoryType | 'all') => {
  if (cat === 'all') return 'Tümü';
  return categoryLabels[cat];
};

const getSentimentLabel = (sent: SentimentType | 'all') => {
  if (sent === 'all') return 'Tümü';
  return sentimentLabels[sent];
};

const getSentimentIcon = (sent: SentimentType | 'all') => {
  switch (sent) {
    case 'positive':
      return <TrendingUp className="w-3 h-3" />;
    case 'negative':
      return <TrendingDown className="w-3 h-3" />;
    case 'neutral':
      return <Minus className="w-3 h-3" />;
    default:
      return <Filter className="w-3 h-3" />;
  }
};

export const NewsFilterComponent = ({ filter, onFilterChange }: NewsFilterProps) => {
  return (
    <div className="w-full space-y-4">
      {/* Main Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-1 bg-slate-900/50 border border-white/5 rounded-lg backdrop-blur-sm">

        {/* Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-r border-white/10 pr-2">
            <Search className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <Input
            placeholder="SYSTEM SEARCH_COMMAND..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="pl-14 h-12 bg-transparent border-none text-slate-200 placeholder:text-slate-600 focus:ring-0 font-mono text-sm tracking-wider"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono hidden md:block">
            CTRL+K
          </div>
        </div>

        {/* Quick Sentiment Toggles */}
        <div className="flex bg-slate-950/80 rounded-md p-1 border border-white/5 mx-2">
          {sentiments.map((sent) => (
            <button
              key={sent}
              onClick={() => onFilterChange({ ...filter, sentiment: sent })}
              className={cn(
                "px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all duration-300 flex items-center gap-2",
                filter.sentiment === sent
                  ? sent === 'positive' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                    : sent === 'negative' ? "bg-red-500/20 text-red-400 border-red-500/50"
                      : "bg-primary/20 text-primary border-primary/50"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {getSentimentLabel(sent)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Strip */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide mask-fade-sides">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange({ ...filter, category: cat })}
            className={cn(
              "whitespace-nowrap px-4 py-2 text-[10px] uppercase font-mono tracking-wider border transition-all duration-300 flex items-center gap-1.5",
              filter.category === cat
                ? "bg-slate-100 text-slate-900 border-slate-100 font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                : "bg-slate-950/30 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
            )}
          >
            {filter.category === cat && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>
    </div>
  );
};
