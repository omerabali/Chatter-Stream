import { WifiOff, Trash2, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineNews } from '@/hooks/useOfflineNews';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function OfflineNewsList() {
  const { user } = useAuth();
  const { offlineNews, isOnline, removeFromOffline, clearOfflineNews } = useOfflineNews();

  if (offlineNews.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-muted-foreground" />
            Çevrimdışı Haberler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Henüz çevrimdışı okuma için kaydedilen haber yok.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <WifiOff className={`w-4 h-4 ${isOnline ? 'text-muted-foreground' : 'text-primary'}`} />
            Çevrimdışı ({offlineNews.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOfflineNews}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Temizle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!isOnline && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            <WifiOff className="w-3 h-3" />
            Çevrimdışı moddasınız
          </div>
        )}
        {offlineNews.slice(0, 5).map(({ news, savedAt }) => (
          <Link
            key={news.id}
            to={`/news/${news.id}`}
            className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {news.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {news.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(savedAt), { addSuffix: true, locale: tr })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFromOffline(news.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Link>
        ))}
        {offlineNews.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            +{offlineNews.length - 5} daha fazla
          </p>
        )}
      </CardContent>
    </Card>
  );
}
