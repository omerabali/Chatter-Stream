import { Bell, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    permission, 
    requestPermission, 
    markAsRead, 
    clearAll 
  } = useNotifications();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    navigate(`/news/${id}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Bildirimler</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
              Temizle
            </Button>
          )}
        </div>

        {permission !== 'granted' && (
          <div className="p-3 bg-muted/50 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Son dakika haberleri için bildirimleri açın
            </p>
            <Button size="sm" onClick={requestPermission} className="w-full text-xs h-8">
              <Bell className="w-3 h-3 mr-1" />
              Bildirimleri Aç
            </Button>
          </div>
        )}

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notification.isBreaking ? (
                      <Zap className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm line-clamp-2 ${notification.isBreaking ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
