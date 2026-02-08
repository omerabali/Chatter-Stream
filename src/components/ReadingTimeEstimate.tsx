import { Clock } from 'lucide-react';

interface ReadingTimeEstimateProps {
  text: string;
  wordsPerMinute?: number;
}

export function ReadingTimeEstimate({ text, wordsPerMinute = 200 }: ReadingTimeEstimateProps) {
  // Turkish average reading speed is around 180-220 words per minute
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
      <Clock className="w-4 h-4" />
      <span>{minutes} dk okuma</span>
    </div>
  );
}
