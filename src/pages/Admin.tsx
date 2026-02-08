import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useFetchNews } from '@/hooks/useFetchNews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { categoryLabels, sentimentLabels } from '@/data/mockNews';
import { CategoryType, SentimentType, DbNews } from '@/types/news';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Loader2, Sparkles, Download, Globe, RefreshCw, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NewsImageUpload } from '@/components/NewsImageUpload';

const analyzeSentiment = async (title: string, summary: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-sentiment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ title, summary }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sentiment analysis failed');
  }

  return response.json();
};

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchExternalNews, saveNewsToDatabase, isFetching } = useFetchNews();

  const [news, setNews] = useState<DbNews[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    source: '',
    category: 'technology' as CategoryType,
    sentiment: 'neutral' as SentimentType,
    sentiment_score: 0.5,
    url: '',
    keywords: '',
    is_breaking: false,
    image_url: null as string | null,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!isLoading && user && !isAdmin) {
      toast({
        title: 'Yetkisiz Erişim',
        description: 'Bu sayfaya erişim yetkiniz yok.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchNews();
    }
  }, [user, isAdmin, isLoading, navigate]);

  const fetchNews = async () => {
    setIsLoadingNews(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });

    if (!error && data) {
      setNews(data as DbNews[]);
    }
    setIsLoadingNews(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      source: '',
      category: 'technology',
      sentiment: 'neutral',
      sentiment_score: 0.5,
      url: '',
      keywords: '',
      is_breaking: false,
      image_url: null,
    });
  };

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.title || !formData.summary || !formData.source) {
      toast({
        title: 'Hata',
        description: 'Lütfen zorunlu alanları doldurun.',
        variant: 'destructive',
      });
      return;
    }

    // Input validation for security
    if (formData.title.length > 200) {
      toast({ title: 'Hata', description: 'Başlık en fazla 200 karakter olabilir.', variant: 'destructive' });
      return;
    }
    if (formData.summary.length > 5000) {
      toast({ title: 'Hata', description: 'Özet en fazla 5000 karakter olabilir.', variant: 'destructive' });
      return;
    }
    if (formData.source.length > 100) {
      toast({ title: 'Hata', description: 'Kaynak en fazla 100 karakter olabilir.', variant: 'destructive' });
      return;
    }
    if (formData.url && formData.url.length > 0) {
      try {
        new URL(formData.url);
      } catch {
        toast({ title: 'Hata', description: 'Geçerli bir URL giriniz.', variant: 'destructive' });
        return;
      }
    }
    if (formData.sentiment_score < 0 || formData.sentiment_score > 1) {
      toast({ title: 'Hata', description: 'Duygu skoru 0 ile 1 arasında olmalıdır.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    // AI Duygu Analizi
    let sentiment = formData.sentiment;
    let sentimentScore = formData.sentiment_score;
    let keywords = formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [];

    try {
      setIsAnalyzing(true);
      toast({
        title: 'AI Analizi',
        description: 'Haber duygu analizi yapılıyor...',
      });

      const analysis = await analyzeSentiment(formData.title, formData.summary);
      sentiment = analysis.sentiment;
      sentimentScore = analysis.sentiment_score;
      if (analysis.keywords && analysis.keywords.length > 0) {
        keywords = [...new Set([...keywords, ...analysis.keywords])];
      }

      toast({
        title: 'AI Analizi Tamamlandı',
        description: `Duygu: ${sentimentLabels[sentiment as SentimentType]} (${(sentimentScore * 100).toFixed(0)}%)`,
      });
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      toast({
        title: 'AI Uyarısı',
        description: 'Duygu analizi yapılamadı, varsayılan değerler kullanılacak.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }

    const { error } = await supabase.from('news').insert({
      title: formData.title,
      summary: formData.summary,
      source: formData.source,
      category: formData.category,
      sentiment,
      sentiment_score: sentimentScore,
      url: formData.url || null,
      keywords,
      is_breaking: formData.is_breaking,
      image_url: formData.image_url,
    });

    if (error) {
      toast({
        title: 'Hata',
        description: 'Haber eklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Haber başarıyla eklendi.',
      });
      resetForm();
      setIsCreating(false);
      fetchNews();
    }
    setIsSaving(false);
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('news')
      .update({
        title: formData.title,
        summary: formData.summary,
        source: formData.source,
        category: formData.category,
        sentiment: formData.sentiment,
        sentiment_score: formData.sentiment_score,
        url: formData.url || null,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
        is_breaking: formData.is_breaking,
        image_url: formData.image_url,
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Hata',
        description: 'Haber güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Haber başarıyla güncellendi.',
      });
      setEditingId(null);
      resetForm();
      fetchNews();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu haberi silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase.from('news').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Hata',
        description: 'Haber silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Haber başarıyla silindi.',
      });
      fetchNews();
    }
  };

  const handleFetchExternalNews = async () => {
    setIsFetchingExternal(true);
    toast({
      title: 'Haberler Çekiliyor',
      description: 'NewsAPI\'den haberler alınıyor ve AI analizi yapılıyor...',
    });

    try {
      const categories = ['general', 'technology', 'business', 'sports', 'health', 'entertainment', 'science'];
      let totalFetched = 0;

      for (const category of categories) {
        const articles = await fetchExternalNews(category);
        if (articles.length > 0) {
          const saved = await saveNewsToDatabase(articles);
          if (saved) {
            totalFetched += articles.length;
          }
        }
      }

      if (totalFetched > 0) {
        toast({
          title: 'Başarılı',
          description: `${totalFetched} haber başarıyla eklendi.`,
        });
        fetchNews();
      } else {
        toast({
          title: 'Bilgi',
          description: 'Yeni haber bulunamadı.',
        });
      }
    } catch (error) {
      console.error('Error fetching external news:', error);
      toast({
        title: 'Hata',
        description: 'Haberler çekilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const handleRecategorize = async () => {
    if (!confirm('Bu işlem mevcut haberlerin kategorilerini AI ile yeniden analiz edecek. Devam etmek istiyor musunuz?')) return;

    setIsRecategorizing(true);
    toast({
      title: 'Yeniden Kategorizasyon',
      description: 'Haberler AI ile yeniden analiz ediliyor...',
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recategorize-news`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ limit: 50 }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Recategorization failed');
      }

      toast({
        title: 'Başarılı',
        description: `${result.processed} haber işlendi, ${result.updated} haber güncellendi.`,
      });
      fetchNews();
    } catch (error) {
      console.error('Recategorization error:', error);
      toast({
        title: 'Hata',
        description: 'Yeniden kategorizasyon sırasında bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsRecategorizing(false);
    }
  };

  const startEditing = (item: DbNews) => {
    setEditingId(item.id);
    setIsCreating(false);
    setFormData({
      title: item.title,
      summary: item.summary,
      source: item.source,
      category: item.category as CategoryType,
      sentiment: item.sentiment as SentimentType,
      sentiment_score: Number(item.sentiment_score),
      url: item.url || '',
      keywords: item.keywords?.join(', ') || '',
      is_breaking: item.is_breaking,
      image_url: item.image_url || null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-grid">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRecategorize}
              disabled={isRecategorizing}
            >
              {isRecategorizing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRecategorizing ? 'Analiz Ediliyor...' : 'Haberleri Yeniden Kategorize Et'}
            </Button>
            <Button
              variant="outline"
              onClick={handleFetchExternalNews}
              disabled={isFetchingExternal}
            >
              {isFetchingExternal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              {isFetchingExternal ? 'Çekiliyor...' : 'Haber Çek (NewsAPI)'}
            </Button>
            <Button onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Haber
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 md:px-6 py-6 space-y-6">
        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-card border border-border rounded-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {isCreating ? 'Yeni Haber Ekle' : 'Haber Düzenle'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlık *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Haber başlığı"
                />
              </div>

              <div className="space-y-2">
                <Label>Kaynak *</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Haber kaynağı"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Özet *</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Haber özeti"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as CategoryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duygu</Label>
                <Select
                  value={formData.sentiment}
                  onValueChange={(value) => setFormData({ ...formData, sentiment: value as SentimentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sentimentLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duygu Skoru (0-1)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.sentiment_score}
                  onChange={(e) => setFormData({ ...formData, sentiment_score: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>URL (Opsiyonel)</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Anahtar Kelimeler (virgülle ayırın)</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="teknoloji, yapay zeka, inovasyon"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_breaking}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_breaking: checked })}
                />
                <Label>Son Dakika</Label>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Haber Görseli</Label>
                <NewsImageUpload
                  imageUrl={formData.image_url}
                  onImageChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
              >
                İptal
              </Button>
              <Button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                disabled={isSaving || isAnalyzing}
              >
                {isSaving || isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isAnalyzing ? 'AI Analizi...' : 'Kaydet (AI Analiz)'}
              </Button>
            </div>
          </div>
        )}

        {/* News List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Haberler ({news.length})
          </h2>

          {isLoadingNews ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Henüz haber bulunmuyor. İlk haberi ekleyin!
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                      {item.is_breaking && (
                        <Badge variant="live" className="text-xs">SON DAKİKA</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[item.category as CategoryType] || item.category}
                      </Badge>
                      <span>•</span>
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{new Date(item.published_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
