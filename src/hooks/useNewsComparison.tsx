import { useState, useCallback, useMemo } from 'react';
import { NewsItem } from '@/types/news';

export interface ComparisonGroup {
  topic: string;
  keywords: string[];
  news: NewsItem[];
}

export function useNewsComparison(allNews: NewsItem[]) {
  const [selectedNews, setSelectedNews] = useState<NewsItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Find similar news based on keywords and title
  const findSimilarNews = useCallback((newsItem: NewsItem): NewsItem[] => {
    const targetKeywords = new Set(newsItem.keywords.map(k => k.toLowerCase()));
    const titleWords = new Set(
      newsItem.title
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    return allNews
      .filter(item => item.id !== newsItem.id)
      .map(item => {
        // Calculate similarity score
        const itemKeywords = new Set(item.keywords.map(k => k.toLowerCase()));
        const itemTitleWords = new Set(
          item.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );

        // Keyword overlap
        const keywordOverlap = [...targetKeywords].filter(k => itemKeywords.has(k)).length;
        
        // Title word overlap
        const titleOverlap = [...titleWords].filter(w => itemTitleWords.has(w)).length;
        
        // Category match bonus
        const categoryBonus = item.category === newsItem.category ? 2 : 0;
        
        const score = keywordOverlap * 3 + titleOverlap + categoryBonus;
        
        return { item, score };
      })
      .filter(({ score }) => score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ item }) => item);
  }, [allNews]);

  // Group similar news by topic
  const newsGroups = useMemo((): ComparisonGroup[] => {
    const groups: ComparisonGroup[] = [];
    const usedIds = new Set<string>();

    // Sort by recency
    const sortedNews = [...allNews].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    for (const newsItem of sortedNews) {
      if (usedIds.has(newsItem.id)) continue;

      const similar = findSimilarNews(newsItem).filter(s => !usedIds.has(s.id));
      
      if (similar.length > 0) {
        const groupNews = [newsItem, ...similar];
        groupNews.forEach(n => usedIds.add(n.id));

        // Find common keywords
        const allKeywords = groupNews.flatMap(n => n.keywords);
        const keywordCounts = allKeywords.reduce((acc, k) => {
          acc[k.toLowerCase()] = (acc[k.toLowerCase()] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const commonKeywords = Object.entries(keywordCounts)
          .filter(([_, count]) => count > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k]) => k);

        // Generate topic name from most common keyword or first news title
        const topic = commonKeywords[0] 
          ? commonKeywords[0].charAt(0).toUpperCase() + commonKeywords[0].slice(1)
          : newsItem.title.split(' ').slice(0, 3).join(' ');

        groups.push({
          topic,
          keywords: commonKeywords,
          news: groupNews.slice(0, 4), // Max 4 news per group
        });
      }
    }

    return groups.slice(0, 10); // Max 10 groups
  }, [allNews, findSimilarNews]);

  const addToComparison = useCallback((news: NewsItem) => {
    setSelectedNews(prev => {
      if (prev.find(n => n.id === news.id)) return prev;
      if (prev.length >= 4) return prev; // Max 4 items
      return [...prev, news];
    });
  }, []);

  const removeFromComparison = useCallback((newsId: string) => {
    setSelectedNews(prev => prev.filter(n => n.id !== newsId));
  }, []);

  const clearComparison = useCallback(() => {
    setSelectedNews([]);
  }, []);

  const startComparison = useCallback(() => {
    setIsComparing(true);
  }, []);

  const endComparison = useCallback(() => {
    setIsComparing(false);
    setSelectedNews([]);
  }, []);

  return {
    selectedNews,
    isComparing,
    newsGroups,
    findSimilarNews,
    addToComparison,
    removeFromComparison,
    clearComparison,
    startComparison,
    endComparison,
  };
}
