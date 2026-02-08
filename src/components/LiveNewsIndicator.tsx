import { Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LiveNewsIndicatorProps {
  onNewNews?: () => void;
}

export const LiveNewsIndicator = ({ onNewNews }: LiveNewsIndicatorProps) => {
  const { lastFetch, isFetching, newNewsCount, clearNewCount, manualFetch } = useAutoFetchNews(5, true);

  const handleRefresh = () => {
    clearNewCount();
    manualFetch();
    onNewNews?.();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Live indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 rounded-full">
            <Radio className="w-3 h-3 text-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive uppercase">Canlı</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Haberler her 5 dakikada otomatik güncelleniyor</p>
          {lastFetch && (
            <p className="text-xs text-muted-foreground">
              Son güncelleme: {formatDistanceToNow(lastFetch, { addSuffix: true, locale: tr })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* New news badge */}
      {newNewsCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-7 text-xs animate-bounce"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          {newNewsCount} Yeni Haber
        </Button>
      )}

      {/* Loading indicator */}
      {isFetching && (
        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};
