import { useState } from 'react';
import { NewsItem } from '@/types/news';
import { useAutoTagging, SuggestedTag } from '@/hooks/useAutoTagging';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, Check, Plus, Loader2, Lightbulb, Tag, 
  ChevronRight, Wand2 
} from 'lucide-react';

interface AutoTagPanelProps {
  news: NewsItem;
  compact?: boolean;
}

export function AutoTagPanel({ news, compact = false }: AutoTagPanelProps) {
  const { user } = useAuth();
  const { 
    isAnalyzing, 
    suggestions, 
    analyzeNews, 
    applyTag, 
    applyAllSuggestions,
    clearSuggestions 
  } = useAutoTagging();
  const [appliedTags, setAppliedTags] = useState<Set<string>>(new Set());

  if (!user) return null;

  const handleAnalyze = async () => {
    setAppliedTags(new Set());
    await analyzeNews(news);
  };

  const handleApplyTag = async (tag: SuggestedTag) => {
    await applyTag(news.id, tag.name, tag.color);
    setAppliedTags(prev => new Set([...prev, tag.name]));
  };

  const handleApplyAll = async () => {
    await applyAllSuggestions(news.id);
    if (suggestions) {
      setAppliedTags(new Set(suggestions.suggested_tags.map(t => t.name)));
    }
  };

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="text-xs"
      >
        {isAnalyzing ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Wand2 className="w-3 h-3 mr-1" />
        )}
        AI Etiketle
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Akıllı Etiketleme</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-xs"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : suggestions ? (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Tekrar Analiz Et
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                AI ile Analiz Et
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isAnalyzing ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : suggestions ? (
          <div className="space-y-4">
            {/* Topic Summary */}
            {suggestions.topic_summary && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Konu Özeti
                  </span>
                </div>
                <p className="text-sm">{suggestions.topic_summary}</p>
              </div>
            )}

            {/* Suggested Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Önerilen Etiketler
                  </span>
                </div>
                {suggestions.suggested_tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleApplyAll}
                    disabled={appliedTags.size === suggestions.suggested_tags.length}
                    className="text-xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Tümünü Ekle
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {suggestions.suggested_tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{tag.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {tag.reason}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => handleApplyTag(tag)}
                      disabled={appliedTags.has(tag.name)}
                    >
                      {appliedTags.has(tag.name) ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Topics */}
            {suggestions.related_topics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    İlgili Konular
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.related_topics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              AI ile haberi analiz edip akıllı etiket önerileri alın
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
