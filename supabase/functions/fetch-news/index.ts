import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY is not configured');
    }

    const { category = 'general', country = 'tr', pageSize = 20, page = 1 } = await req.json().catch(() => ({}));

    // Map our categories to NewsAPI categories
    const categoryMap: Record<string, string> = {
      'politics': 'general',
      'economy': 'business',
      'technology': 'technology',
      'sports': 'sports',
      'health': 'health',
      'world': 'general',
      'entertainment': 'entertainment',
      'education': 'general',
      'science': 'science',
      'environment': 'science',
      'automotive': 'technology',
      'crypto': 'business',
      'finance': 'business',
      'realestate': 'business',
      'agriculture': 'general',
      'general': 'general',
      'business': 'business',
    };

    const newsApiCategory = categoryMap[category] || 'general';

    // Use different endpoints for variety
    const useEverything = page > 1 || Math.random() > 0.5;
    
    let url: string;
    if (useEverything) {
      // "Everything" endpoint for more variety
      const queries = ['türkiye', 'dünya', 'ekonomi', 'spor', 'teknoloji'];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      url = `https://newsapi.org/v2/everything?q=${randomQuery}&language=tr&sortBy=publishedAt&pageSize=${pageSize}&page=${page}&apiKey=${NEWSAPI_KEY}`;
    } else {
      // Top headlines
      url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${newsApiCategory}&pageSize=${pageSize}&apiKey=${NEWSAPI_KEY}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      console.error('NewsAPI error:', data);
      throw new Error(data.message || 'Failed to fetch news');
    }

    // Filter out articles with "[Removed]" content or without title/description
    const validArticles = data.articles.filter((article: any) => 
      article.title && 
      article.title !== '[Removed]' && 
      article.description && 
      article.description !== '[Removed]'
    );

    // Transform NewsAPI response to our format with unique IDs
    const articles = validArticles.map((article: any, index: number) => {
      // Create unique ID from URL hash
      const urlHash = article.url ? 
        article.url.split('').reduce((a: number, b: string) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0).toString(16) : 
        `${Date.now()}-${index}`;
      
      return {
        id: `newsapi-${urlHash}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) || 'Özet yok',
        source: article.source?.name || 'Bilinmeyen Kaynak',
        category: category,
        publishedAt: article.publishedAt || new Date().toISOString(),
        imageUrl: article.urlToImage || null,
        url: article.url || null,
        isBreaking: index < 2 && !useEverything, // First 2 from top-headlines are breaking
      };
    });

    return new Response(JSON.stringify({ 
      articles,
      totalResults: data.totalResults,
      hasMore: data.totalResults > pageSize * page
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
