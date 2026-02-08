import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNews } from '@/hooks/useNews';
import { Newspaper, Search, Star, StarOff } from 'lucide-react';

interface SourceFilterPanelProps {
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
}

export function SourceFilterPanel({ selectedSources, onSourcesChange }: SourceFilterPanelProps) {
  const { user } = useAuth();
  const { news } = useNews();
  const { preferences, updatePreferences } = useUserPreferences();
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique sources from news
  const allSources = useMemo(() => {
    const sourceCounts = new Map<string, number>();
    news.forEach(item => {
      const count = sourceCounts.get(item.source) || 0;
      sourceCounts.set(item.source, count + 1);
    });
    return Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));
  }, [news]);

  const filteredSources = useMemo(() => {
    if (!searchQuery) return allSources;
    return allSources.filter(({ source }) => 
      source.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSources, searchQuery]);

  const favoriteSources = preferences?.favorite_sources || [];

  const handleSourceToggle = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter(s => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  const handleFavoriteToggle = async (source: string) => {
    if (!user) return;
    
    const newFavorites = favoriteSources.includes(source)
      ? favoriteSources.filter(s => s !== source)
      : [...favoriteSources, source];
    
    await updatePreferences({ favorite_sources: newFavorites });
  };

  const clearFilters = () => {
    onSourcesChange([]);
  };

  const selectFavorites = () => {
    onSourcesChange(favoriteSources);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            Kaynak Filtresi
          </CardTitle>
          {selectedSources.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedSources.length} seçili
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Kaynak ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {user && favoriteSources.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectFavorites}
              className="text-xs h-7"
            >
              <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
              Favoriler
            </Button>
          )}
          {selectedSources.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-7"
            >
              Temizle
            </Button>
          )}
        </div>

        {/* Source List */}
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {filteredSources.map(({ source, count }) => {
              const isSelected = selectedSources.includes(source);
              const isFavorite = favoriteSources.includes(source);

              return (
                <div
                  key={source}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Checkbox
                      id={`source-${source}`}
                      checked={isSelected}
                      onCheckedChange={() => handleSourceToggle(source)}
                    />
                    <label 
                      htmlFor={`source-${source}`}
                      className="text-sm truncate cursor-pointer flex-1"
                    >
                      {source}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                    {user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleFavoriteToggle(source)}
                      >
                        {isFavorite ? (
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {filteredSources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Kaynak bulunamadı
          </p>
        )}
      </CardContent>
    </Card>
  );
}
