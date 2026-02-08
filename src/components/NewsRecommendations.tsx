import { Sparkles, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNewsRecommendations } from '@/hooks/useNewsRecommendations';
import { useNews } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function NewsRecommendations() {
  const { user } = useAuth();
  const { news } = useNews();
  const { recommendations, userPreferences, isLoading } = useNewsRecommendations(news);

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Öneriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Kişiselleştirilmiş öneriler için giriş yapın.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Öneriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Öneriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Daha fazla haber okuyarak kişiselleştirilmiş öneriler alın.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Size Özel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* User preferences summary */}
        {userPreferences && userPreferences.favoriteCategories.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              İlgi Alanlarınız
            </p>
            <div className="flex flex-wrap gap-1">
              {userPreferences.favoriteCategories.slice(0, 3).map(cat => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended news */}
        <div className="space-y-2">
          {recommendations.slice(0, 5).map(item => (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs h-4 px-1">
                      {item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.source}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SimilarNewsProps {
  newsId: string;
}

export function SimilarNews({ newsId }: SimilarNewsProps) {
  const { news } = useNews();
  const { getSimilarNews } = useNewsRecommendations(news);
  
  const similar = getSimilarNews(newsId, 4);

  if (similar.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Benzer Haberler
      </h3>
      <div className="grid gap-2">
        {similar.map(item => (
          <Link
            key={item.id}
            to={`/news/${item.id}`}
            className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
          >
            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {item.source}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
