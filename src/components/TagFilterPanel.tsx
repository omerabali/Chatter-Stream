import { Tag, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNewsTags } from '@/hooks/useNewsTags';
import { useAuth } from '@/hooks/useAuth';

interface TagFilterPanelProps {
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
}

export function TagFilterPanel({ selectedTagId, onTagSelect }: TagFilterPanelProps) {
  const { user } = useAuth();
  const { tags } = useNewsTags();

  if (!user || tags.length === 0) return null;

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Etiketler
        </h4>
        {selectedTagId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTagSelect(null)}
            className="h-6 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Temizle
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Badge
            key={tag.id}
            variant={selectedTagId === tag.id ? 'default' : 'outline'}
            style={{
              borderColor: tag.color,
              color: selectedTagId === tag.id ? 'white' : tag.color,
              backgroundColor: selectedTagId === tag.id ? tag.color : 'transparent',
            }}
            className="cursor-pointer transition-all hover:scale-105"
            onClick={() => onTagSelect(selectedTagId === tag.id ? null : tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
