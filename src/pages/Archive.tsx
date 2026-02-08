import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { NewsCard } from '@/components/NewsCard';
import { useNews } from '@/hooks/useNews';
import { CategoryType, SentimentType, NewsItem } from '@/types/news';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import {
  Search, Calendar, Filter, X, Archive as ArchiveIcon,
  ChevronDown, Loader2, SlidersHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const allCategories: CategoryType[] = [
  'politics', 'economy', 'technology', 'sports', 'health', 'world',
  'entertainment', 'education', 'science', 'environment', 'automotive',
  'crypto', 'finance', 'realestate', 'agriculture', 'crime'
];

const allSentiments: SentimentType[] = ['positive', 'neutral', 'negative'];

const Archive = () => {
  const { news, isLoading } = useNews();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInContent, setSearchInContent] = useState(true);
  const [searchInKeywords, setSearchInKeywords] = useState(true);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<SentimentType[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Get unique sources from news
  const availableSources = useMemo(() => {
    return [...new Set(news.map(n => n.source))].sort();
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = searchInTitle && item.title.toLowerCase().includes(query);
        const matchesContent = searchInContent && item.summary.toLowerCase().includes(query);
        const matchesKeywords = searchInKeywords && item.keywords.some(k => k.toLowerCase().includes(query));

        if (!matchesTitle && !matchesContent && !matchesKeywords) {
          return false;
        }
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category as CategoryType)) {
        return false;
      }

      // Sentiment filter
      if (selectedSentiments.length > 0 && !selectedSentiments.includes(item.sentiment as SentimentType)) {
        return false;
      }

      // Source filter
      if (selectedSources.length > 0 && !selectedSources.includes(item.source)) {
        return false;
      }

      // Date range filter
      const itemDate = new Date(item.publishedAt);
      if (dateFrom && itemDate < dateFrom) {
        return false;
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [news, searchQuery, searchInTitle, searchInContent, searchInKeywords,
    selectedCategories, selectedSentiments, selectedSources, dateFrom, dateTo]);

  const toggleCategory = (cat: CategoryType) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSentiment = (sent: SentimentType) => {
    setSelectedSentiments(prev =>
      prev.includes(sent) ? prev.filter(s => s !== sent) : [...prev, sent]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedSentiments([]);
    setSelectedSources([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedSentiments.length +
    selectedSources.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <Header />

      <main className="w-full px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArchiveIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Haber Arşivi</h1>
            <Badge variant="secondary" className="font-mono">
              {filteredNews.length} / {news.length}
            </Badge>
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Filtreleri Temizle ({activeFiltersCount})
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Gelişmiş Arama
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Anahtar kelime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="searchTitle"
                      checked={searchInTitle}
                      onCheckedChange={(c) => setSearchInTitle(!!c)}
                    />
                    <Label htmlFor="searchTitle" className="text-sm">Başlıklarda ara</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="searchContent"
                      checked={searchInContent}
                      onCheckedChange={(c) => setSearchInContent(!!c)}
                    />
                    <Label htmlFor="searchContent" className="text-sm">İçerikte ara</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="searchKeywords"
                      checked={searchInKeywords}
                      onCheckedChange={(c) => setSearchInKeywords(!!c)}
                    />
                    <Label htmlFor="searchKeywords" className="text-sm">Anahtar kelimelerde ara</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tarih Aralığı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Başlangıç</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: tr }) : 'Tarih seç'}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Bitiş</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {dateTo ? format(dateTo, 'dd MMM yyyy', { locale: tr }) : 'Tarih seç'}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                  >
                    Tarihleri Temizle
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Kategoriler
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">{selectedCategories.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        selectedCategories.includes(cat)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-accent"
                      )}
                    >
                      {categoryLabels[cat]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sentiments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Duygu Analizi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allSentiments.map((sent) => (
                    <button
                      key={sent}
                      onClick={() => toggleSentiment(sent)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md transition-colors",
                        selectedSentiments.includes(sent)
                          ? sent === 'positive'
                            ? "bg-success/20 text-success border border-success"
                            : sent === 'negative'
                              ? "bg-destructive/20 text-destructive border border-destructive"
                              : "bg-muted-foreground/20 text-muted-foreground border border-muted-foreground"
                          : "bg-muted hover:bg-accent"
                      )}
                    >
                      {sentimentLabels[sent]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Kaynaklar
                  {selectedSources.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{selectedSources.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableSources.map((source) => (
                    <div key={source} className="flex items-center gap-2">
                      <Checkbox
                        id={`source-${source}`}
                        checked={selectedSources.includes(source)}
                        onCheckedChange={() => toggleSource(source)}
                      />
                      <Label htmlFor={`source-${source}`} className="text-sm cursor-pointer">
                        {source}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredNews.length === 0 ? (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <ArchiveIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">Arama kriterlerine uygun haber bulunamadı.</p>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Filtreleri Temizle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredNews.map((item, index) => (
                  <NewsCard key={item.id} news={item} index={index} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Archive;
