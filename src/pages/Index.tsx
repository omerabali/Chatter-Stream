import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { NewsCard } from '@/components/NewsCard';
import { NewsFilterComponent } from '@/components/NewsFilter';
import { StatsPanel } from '@/components/StatsPanel';
import { PreferencesPanel } from '@/components/PreferencesPanel';
import { ReadingStatsCard } from '@/components/ReadingStatsCard';
import { NotificationSettings } from '@/components/NotificationSettings';
import { EmailPreferencesPanel } from '@/components/EmailPreferencesPanel';
import { NewsRecommendations } from '@/components/NewsRecommendations';
import { OfflineNewsList } from '@/components/OfflineNewsList';
import { TagFilterPanel } from '@/components/TagFilterPanel';
import { SourceFilterPanel } from '@/components/SourceFilterPanel';
import { NewsComparisonPanel } from '@/components/NewsComparisonPanel';
import { NewsGroupCard } from '@/components/NewsGroupCard';
import { useInfiniteNews } from '@/hooks/useInfiniteNews';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNewsTags } from '@/hooks/useNewsTags';
import { useNewsComparison } from '@/hooks/useNewsComparison';
import { useAuth } from '@/hooks/useAuth';
import { NewsFilter, NewsItem } from '@/types/news';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, ArrowUpDown, Zap, Sparkles, Scale, Layers, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SortOption = 'date' | 'category' | 'sentiment' | 'source';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { news, isLoading, isLoadingMore, hasMore, loadMore, refresh } = useInfiniteNews();
  const { preferences } = useUserPreferences();
  const { getNewsIdsForTag } = useNewsTags();
  const loaderRef = useRef<HTMLDivElement>(null);
  const {
    selectedNews: comparisonNews,
    isComparing,
    newsGroups,
    addToComparison,
    removeFromComparison,
    clearComparison,
    startComparison,
    endComparison,
  } = useNewsComparison(news);

  const [filter, setFilter] = useState<NewsFilter>({
    category: 'all',
    sentiment: 'all',
    searchQuery: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedNews = useMemo(() => {
    // Get news IDs for selected tag
    const taggedNewsIds = selectedTagId ? new Set(getNewsIdsForTag(selectedTagId)) : null;

    let filtered = news.filter((item) => {
      const matchesCategory = filter.category === 'all' || item.category === filter.category;
      const matchesSentiment = filter.sentiment === 'all' || item.sentiment === filter.sentiment;
      const matchesSearch = filter.searchQuery === '' ||
        item.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(filter.searchQuery.toLowerCase()));

      // Filter by selected tag
      const matchesTag = !taggedNewsIds || taggedNewsIds.has(item.id);

      // Filter by selected sources
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(item.source);

      // Personalized filtering based on user preferences
      let matchesPreferences = true;
      if (showPersonalized && preferences) {
        const favoriteCategories = preferences.favorite_categories || [];
        const favoriteKeywords = preferences.favorite_keywords || [];

        const matchesFavoriteCategory = favoriteCategories.length === 0 ||
          favoriteCategories.includes(item.category);
        const matchesFavoriteKeyword = favoriteKeywords.length === 0 ||
          item.keywords.some(k => favoriteKeywords.some(fk => k.toLowerCase().includes(fk.toLowerCase()))) ||
          favoriteKeywords.some(fk => item.title.toLowerCase().includes(fk.toLowerCase())) ||
          favoriteKeywords.some(fk => item.summary.toLowerCase().includes(fk.toLowerCase()));

        matchesPreferences = matchesFavoriteCategory || matchesFavoriteKeyword;
      }

      return matchesCategory && matchesSentiment && matchesSearch && matchesPreferences && matchesTag && matchesSource;
    });

    // Sort breaking news first, then by selected option
    filtered.sort((a, b) => {
      // Breaking news always first
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;

      switch (sortBy) {
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        case 'sentiment':
          return b.sentimentScore - a.sentimentScore;
        case 'source':
          return a.source.localeCompare(b.source);
        default:
          return 0;
      }
    });

    return filtered;
  }, [news, filter, sortBy, showPersonalized, preferences, selectedTagId, getNewsIdsForTag, selectedSources]);

  // Breaking news
  const breakingNews = useMemo(() => {
    return filteredAndSortedNews.filter(item => item.isBreaking);
  }, [filteredAndSortedNews]);

  const handleCompareGroup = (groupNews: NewsItem[]) => {
    clearComparison();
    groupNews.forEach(n => addToComparison(n));
    startComparison();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setLastUpdate(new Date());

    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Haberler güncellendi",
        description: `${news.length} haber başarıyla yenilendi.`,
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background terminal-grid selection:bg-primary/20 selection:text-primary pb-20">
      <Header />

      <main className="w-full max-w-[1800px] mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* SECTION 1: HERO & INSIGHTS (Matching Reference 'Landing' feel) */}
        <section className="grid lg:grid-cols-12 gap-6 items-stretch">

          {/* Main Hero Text */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-sm bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/5 p-8 md:p-12 animate-fade-in shadow-2xl flex flex-col justify-center min-h-[400px]">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/5 border border-white/5 text-[10px] font-mono text-blue-400 mb-6 backdrop-blur-sm tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                ARGUS SYSTEM // ONLINE
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-none">
                ARGUS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">INTELLIGENCE</span>
              </h1>

              <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8 border-l-2 border-blue-500/50 pl-6">
                Next-generation global monitoring and signal extraction engine.
              </p>

              <div className="flex gap-4">
                <Button className="h-12 px-8 bg-primary hover:bg-amber-400 text-black font-bold tracking-wide rounded-sm text-sm" onClick={startComparison}>
                  <Zap className="w-4 h-4 mr-2" />
                  INITIATE SCAN
                </Button>
                <Button variant="outline" className="h-12 px-8 border-white/10 text-white hover:bg-white/5 hover:text-white rounded-sm text-sm font-mono" onClick={() => navigate('/trends')}>
                  VIEW LIVE TELEMETRY
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Key Metrics (Reference Image Style) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1 */}
            <div className="h-1/3 bg-[#0a0f1e] border border-white/5 rounded-sm p-6 flex flex-col justify-center relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-blue-500/10 rounded-sm">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Throughput</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1 font-mono group-hover:text-blue-400 transition-colors">15,420</div>
              <div className="text-xs text-slate-400">Items analyzed / sec</div>
            </div>

            {/* Card 2 */}
            <div className="h-1/3 bg-[#0a0f1e] border border-white/5 rounded-sm p-6 flex flex-col justify-center relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-primary/10 rounded-sm">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Precision</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1 font-mono group-hover:text-primary transition-colors">99.8%</div>
              <div className="text-xs text-slate-400">Contextual accuracy</div>
            </div>

            {/* Card 3 - Latency */}
            <div className="h-1/3 bg-[#0a0f1e] border border-white/5 rounded-sm p-6 flex flex-col justify-center relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-emerald-500/10 rounded-sm">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Global Latency</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1 font-mono group-hover:text-emerald-400 transition-colors">12ms</div>
              <div className="text-xs text-slate-400">Edge-to-core sync</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CONTROL BAR */}
        <div className="sticky top-20 z-40 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 md:px-6">
          <NewsFilterComponent filter={filter} onFilterChange={setFilter} />
        </div>

        {/* SECTION 3: CONTENT GRID */}
        <section className="space-y-4">
          {/* Header & Sort */}
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary rounded-sm inline-block" />
                LIVE INTELLIGENCE FEED
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1 ml-5">
                Displaying {filteredAndSortedNews.length} active signals // Real-time
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Status */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Stream</span>
              </div>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px] h-9 text-xs bg-slate-950 border-white/10 text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  <SelectItem value="date">Time: Newest First</SelectItem>
                  <SelectItem value="category">Group: Category</SelectItem>
                  <SelectItem value="sentiment">Sort: Sentiment</SelectItem>
                  <SelectItem value="source">Sort: Source Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-64 bg-slate-900/50 rounded-sm border border-white/5" />
              ))}
            </div>
          ) : filteredAndSortedNews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-lg bg-slate-950/30">
              <Search className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400 mb-2 font-mono text-lg">NO SIGNALS DETECTED</p>
              <div className="text-xs text-slate-600 mb-6 font-mono max-w-md">The system could not locate any intelligence matching your parameters. <br /> Try broadening your search or resetting filters.</div>
              <Button variant="outline" size="sm" onClick={() => setFilter({ category: 'all', sentiment: 'all', searchQuery: '' })} className="border-white/10 text-slate-300 hover:bg-white/5">
                RESET PARAMETERS
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedNews.map((item, index) => (
                <NewsCard
                  key={item.id}
                  news={item}
                  index={index}
                  isSelectedForComparison={comparisonNews.some(n => n.id === item.id)}
                  onCompareToggle={() => {
                    if (comparisonNews.some(n => n.id === item.id)) {
                      removeFromComparison(item.id);
                    } else {
                      addToComparison(item);
                    }
                  }}
                  comparisonDisabled={comparisonNews.length >= 4}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Loader */}
          <div ref={loaderRef} className="flex justify-center py-12 border-t border-white/5 mt-8">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-mono tracking-widest">SYNCING OLDER RECORDS...</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Comparison Floating Bar - Redesigned */}
      {comparisonNews.length > 0 && !isComparing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="bg-[#0f172a] shadow-2xl border border-primary/50 rounded-full px-6 py-3 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">
                {comparisonNews.length} <span className="text-slate-400 font-normal">selected</span>
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={clearComparison} className="text-slate-400 hover:text-white h-8">
                Clear
              </Button>
              <Button size="sm" onClick={startComparison} className="bg-primary hover:bg-primary/90 text-black font-bold h-8 rounded-full px-6">
                Compare Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* News Comparison Panel */}
      <NewsComparisonPanel
        selectedNews={comparisonNews}
        onRemove={removeFromComparison}
        onClear={clearComparison}
        isOpen={isComparing}
        onClose={endComparison}
      />
    </div>
  );
};

export default Index;
