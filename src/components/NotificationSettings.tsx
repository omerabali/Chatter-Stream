import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading, toggleSubscription } = usePushNotifications();

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Bildirimleri etkinleştirmek için giriş yapın.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-primary" />
          Bildirimler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tarayıcınız push bildirimleri desteklemiyor.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : isSubscribed ? (
                  <Bell className="w-5 h-5 text-success" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="push-notifications" className="font-medium">
                    Push Bildirimleri
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed
                      ? 'Yeni haberlerden haberdar olacaksınız'
                      : 'Yeni haberler için bildirim alın'}
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={toggleSubscription}
                disabled={isLoading}
              />
            </div>

            {isSubscribed && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success">
                  ✓ Bildirimler aktif. Favori kategorilerinizdeki yeni haberler için bildirim alacaksınız.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
