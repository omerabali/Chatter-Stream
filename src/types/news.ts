export type SentimentType = 'positive' | 'negative' | 'neutral';

export type CategoryType = 
  | 'politics' 
  | 'economy' 
  | 'technology' 
  | 'sports' 
  | 'health' 
  | 'world' 
  | 'entertainment'
  | 'education'
  | 'science'
  | 'environment'
  | 'automotive'
  | 'crypto'
  | 'finance'
  | 'realestate'
  | 'agriculture'
  | 'crime';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: CategoryType;
  sentiment: SentimentType;
  sentimentScore: number;
  publishedAt: Date;
  isBreaking?: boolean;
  keywords: string[];
  imageUrl?: string;
  url?: string;
}

export interface NewsFilter {
  category: CategoryType | 'all';
  sentiment: SentimentType | 'all';
  searchQuery: string;
}

export interface DbNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  sentiment: string;
  sentiment_score: number;
  published_at: string;
  is_breaking: boolean;
  keywords: string[];
  image_url: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}
