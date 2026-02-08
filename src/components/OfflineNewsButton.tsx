import { WifiOff, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineNews } from '@/hooks/useOfflineNews';
import { NewsItem } from '@/types/news';

interface OfflineNewsButtonProps {
  news: NewsItem;
  variant?: 'icon' | 'full';
}

export function OfflineNewsButton({ news, variant = 'icon' }: OfflineNewsButtonProps) {
  const { isAvailableOffline, saveForOffline, removeFromOffline } = useOfflineNews();
  const isOffline = isAvailableOffline(news.id);

  const handleToggle = () => {
    if (isOffline) {
      removeFromOffline(news.id);
    } else {
      saveForOffline(news);
    }
  };

  if (variant === 'full') {
    return (
      <Button
        variant={isOffline ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
      >
        {isOffline ? (
          <>
            <Check className="w-4 h-4" />
            Çevrimdışı Kayıtlı
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Çevrimdışı Kaydet
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={isOffline ? 'text-primary' : 'text-muted-foreground hover:text-primary'}
      title={isOffline ? 'Çevrimdışı listesinden kaldır' : 'Çevrimdışı okuma için kaydet'}
    >
      {isOffline ? (
        <WifiOff className="w-4 h-4 fill-current" />
      ) : (
        <Download className="w-4 h-4" />
      )}
    </Button>
  );
}
