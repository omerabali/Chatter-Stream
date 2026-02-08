import { useEmailPreferences } from '@/hooks/useEmailPreferences';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Zap, Star, Calendar } from 'lucide-react';

export function EmailPreferencesPanel() {
  const { user } = useAuth();
  const { preferences, isLoading, updatePreferences } = useEmailPreferences();

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">E-posta Bildirimleri</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <Label htmlFor="daily-digest" className="text-sm font-medium">
                Günlük Özet
              </Label>
              <p className="text-xs text-muted-foreground">
                Her gün öne çıkan haberleri al
              </p>
            </div>
          </div>
          <Switch
            id="daily-digest"
            checked={preferences?.daily_digest ?? true}
            onCheckedChange={(checked) => updatePreferences({ daily_digest: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-destructive" />
            <div>
              <Label htmlFor="breaking-news" className="text-sm font-medium">
                Son Dakika
              </Label>
              <p className="text-xs text-muted-foreground">
                Önemli gelişmelerde bildirim al
              </p>
            </div>
          </div>
          <Switch
            id="breaking-news"
            checked={preferences?.breaking_news ?? true}
            onCheckedChange={(checked) => updatePreferences({ breaking_news: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <div>
              <Label htmlFor="favorites" className="text-sm font-medium">
                Favori Kategoriler
              </Label>
              <p className="text-xs text-muted-foreground">
                Takip ettiğin konularda bildirim al
              </p>
            </div>
          </div>
          <Switch
            id="favorites"
            checked={preferences?.favorite_categories_updates ?? true}
            onCheckedChange={(checked) => updatePreferences({ favorite_categories_updates: checked })}
          />
        </div>

        {preferences?.last_digest_sent_at && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Son özet: {new Date(preferences.last_digest_sent_at).toLocaleDateString('tr-TR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
