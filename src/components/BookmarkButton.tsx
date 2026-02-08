import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useSavedNews } from '@/hooks/useSavedNews';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  newsId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export const BookmarkButton = ({
  newsId,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: BookmarkButtonProps) => {
  const { isSaved, toggleSave, isLoading } = useSavedNews();
  const saved = isSaved(newsId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(newsId);
  };

  return (
    <Button
      variant={saved ? 'default' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        saved && 'bg-primary text-primary-foreground',
        !showLabel && 'px-2'
      )}
    >
      <Bookmark className={cn('w-4 h-4', showLabel && 'mr-2', saved && 'fill-current')} />
      {showLabel && (saved ? 'Kaydedildi' : 'Kaydet')}
    </Button>
  );
};
