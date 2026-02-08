import { useState } from 'react';
import { AVAILABLE_EMOJIS, ReactionCount } from '@/hooks/useCommentReactions';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface CommentReactionsProps {
  commentId: string;
  reactionCounts: ReactionCount[];
  onToggleReaction: (commentId: string, emoji: string) => void;
}

export function CommentReactions({ 
  commentId, 
  reactionCounts, 
  onToggleReaction 
}: CommentReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {reactionCounts.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => onToggleReaction(commentId, emoji)}
          className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors
            ${hasReacted 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'bg-muted hover:bg-muted/80 border border-transparent'
            }
          `}
        >
          <span>{emoji}</span>
          <span className="font-mono">{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <SmilePlus className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {AVAILABLE_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  onToggleReaction(commentId, emoji);
                  setIsOpen(false);
                }}
                className="text-lg hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
