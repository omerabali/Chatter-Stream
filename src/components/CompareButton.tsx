import { NewsItem } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Scale, Check } from 'lucide-react';

interface CompareButtonProps {
  news: NewsItem;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function CompareButton({ news, isSelected, onToggle, disabled }: CompareButtonProps) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      disabled={disabled && !isSelected}
      className={`text-xs ${isSelected ? 'bg-primary' : ''}`}
      title={disabled && !isSelected ? 'Maksimum 4 haber karşılaştırılabilir' : 'Karşılaştırmaya ekle'}
    >
      {isSelected ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Seçildi
        </>
      ) : (
        <>
          <Scale className="w-3 h-3 mr-1" />
          Karşılaştır
        </>
      )}
    </Button>
  );
}
