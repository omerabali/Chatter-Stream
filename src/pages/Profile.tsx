import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useSavedNews } from '@/hooks/useSavedNews';
import { categoryLabels } from '@/data/mockNews';
import { User, Mail, Shield, Calendar, ArrowLeft, Save, Loader2, Heart, MessageCircle, Trash2, Bookmark, Eye, Clock, BarChart3, Activity, Camera } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  created_at: string;
  avatar_url?: string | null;
  bio?: string | null;
  display_name?: string | null;
}

interface LikedNews {
  id: string;
  news_id: string;
  created_at: string;
  news?: {
    id: string;
    title: string;
    category: string;
  };
}

interface UserComment {
  id: string;
  news_id: string;
  content: string;
  created_at: string;
  news?: {
    id: string;
    title: string;
  };
}

interface SavedNewsItem {
  id: string;
  news_id: string;
  created_at: string;
  news?: {
    id: string;
    title: string;
    category: string;
  };
}

interface ReadingStats {
  totalViews: number;
  totalReadingTime: number;
  categoryStats: Record<string, { views: number; time: number }>;
  recentViews: { newsId: string; title: string; viewedAt: string; category: string }[];
}

export default function Profile() {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { savedNews: savedNewsIds, toggleSave } = useSavedNews();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Data
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Account Data
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Activity Data
  const [likedNews, setLikedNews] = useState<LikedNews[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [savedNewsItems, setSavedNewsItems] = useState<SavedNewsItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || ''); // Initialize with auth email
      fetchProfile();
      fetchActivity();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName((data as any).display_name || '');
        setBio((data as any).bio || '');
        setAvatarUrl((data as any).avatar_url || '');
      }

      // Fetch reading stats
      const { data: viewsData } = await supabase
        .from('news_views')
        .select('news_id, reading_time_seconds, viewed_at, news:news_id (title, category)')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });

      if (viewsData) {
        let totalReadingTime = 0;
        const categoryStats: Record<string, { views: number; time: number }> = {};

        viewsData.forEach((view: any) => {
          const time = view.reading_time_seconds || 0;
          totalReadingTime += time;
          const category = view.news?.category || 'unknown';
          if (!categoryStats[category]) categoryStats[category] = { views: 0, time: 0 };
          categoryStats[category].views++;
          categoryStats[category].time += time;
        });

        setReadingStats({
          totalViews: viewsData.length,
          totalReadingTime,
          categoryStats,
          recentViews: viewsData.slice(0, 10).map((v: any) => ({
            newsId: v.news_id,
            title: v.news?.title || '',
            viewedAt: v.viewed_at,
            category: v.news?.category || ''
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivity = async () => {
    if (!user) return;
    setIsLoadingActivity(true);

    try {
      // Fetch liked news
      const { data: likesData } = await supabase
        .from('news_likes')
        .select('id, news_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesData && likesData.length > 0) {
        const newsIds = likesData.map(l => l.news_id);
        const { data: newsData } = await supabase
          .from('news')
          .select('id, title, category')
          .in('id', newsIds);

        const likesWithNews = likesData.map(like => ({
          ...like,
          news: newsData?.find(n => n.id === like.news_id),
        }));
        setLikedNews(likesWithNews);
      } else {
        setLikedNews([]);
      }

      // Fetch user comments
      const { data: commentsData } = await supabase
        .from('news_comments')
        .select('id, news_id, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (commentsData && commentsData.length > 0) {
        const newsIds = [...new Set(commentsData.map(c => c.news_id))];
        const { data: newsData } = await supabase
          .from('news')
          .select('id, title')
          .in('id', newsIds);

        const commentsWithNews = commentsData.map(comment => ({
          ...comment,
          news: newsData?.find(n => n.id === comment.news_id),
        }));
        setComments(commentsWithNews);
      } else {
        setComments([]);
      }

      // Fetch saved news
      const { data: savedData } = await supabase
        .from('saved_news')
        .select('id, news_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedData && savedData.length > 0) {
        const newsIds = savedData.map(s => s.news_id);
        const { data: newsData } = await supabase
          .from('news')
          .select('id, title, category')
          .in('id', newsIds);

        const savedWithNews = savedData.map(saved => ({
          ...saved,
          news: newsData?.find(n => n.id === saved.news_id),
        }));
        setSavedNewsItems(savedWithNews);
      } else {
        setSavedNewsItems([]);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // 1. Update Public Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl
        } as any)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 2. Update Auth (Email/Password)
      const authUpdates: any = {};
      if (newPassword) authUpdates.password = newPassword;
      if (email !== user.email) authUpdates.email = email;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;

        if (authUpdates.password) {
          setNewPassword('');
          toast({ title: 'Güvenlik', description: 'Şifreniz başarıyla güncellendi.' });
        }
        if (authUpdates.email) {
          toast({ title: 'Güvenlik', description: 'E-posta güncellemesi için doğrulama bağlantısı gönderildi.' });
        }
      }

      toast({
        title: 'Başarılı',
        description: 'Profil bilgileriniz güncellendi.',
      });

      if (profile) {
        setProfile({ ...profile, display_name: displayName, bio, avatar_url: avatarUrl });
      }

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Profil güncellenemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('news_comments').delete().eq('id', commentId);
    if (error) {
      toast({ title: 'Hata', description: 'Yorum silinemedi.', variant: 'destructive' });
    } else {
      setComments(comments.filter(c => c.id !== commentId));
      toast({ title: 'Başarılı', description: 'Yorum silindi.' });
    }
  };

  const handleUnlike = async (likeId: string) => {
    const { error } = await supabase.from('news_likes').delete().eq('id', likeId);
    if (error) {
      toast({ title: 'Hata', description: 'Beğeni kaldırılamadı.', variant: 'destructive' });
    } else {
      setLikedNews(likedNews.filter(l => l.id !== likeId));
      toast({ title: 'Başarılı', description: 'Beğeni kaldırıldı.' });
    }
  };

  const handleRemoveSaved = async (newsId: string) => {
    await toggleSave(newsId);
    setSavedNewsItems(savedNewsItems.filter(s => s.news_id !== newsId));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="h-6 w-6 text-primary" />
                  Profil Ayarları
                </CardTitle>
                <CardDescription>
                  Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin
                </CardDescription>
              </div>
              {isAdmin && (
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/50">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto bg-muted/50 p-1">
                <TabsTrigger value="profile" className="text-xs px-2 data-[state=active]:bg-background">Kontrol Paneli</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs px-2 flex items-center gap-1 data-[state=active]:bg-background">
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">İstatistik</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="text-xs px-2 flex items-center gap-1 data-[state=active]:bg-background">
                  <Bookmark className="h-3 w-3" />
                  <span className="hidden sm:inline">Kayıtlı</span>
                </TabsTrigger>
                <TabsTrigger value="likes" className="text-xs px-2 flex items-center gap-1 data-[state=active]:bg-background">
                  <Heart className="h-3 w-3" />
                  <span className="hidden sm:inline">Beğeni</span>
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs px-2 flex items-center gap-1 data-[state=active]:bg-background">
                  <MessageCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Yorum</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-8 mt-8">
                {/* 1. KİŞİSEL BİLGİLER */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                    <User className="w-5 h-5 text-primary" />
                    Kişisel Bilgiler
                  </h3>

                  {/* Avatar */}
                  <div className="flex justify-center py-4">
                    <AvatarUpload
                      avatarUrl={avatarUrl}
                      onAvatarChange={setAvatarUrl}
                      displayName={displayName}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Kullanıcı Adı / Görünen Ad</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Örn: Ahmet Yılmaz"
                        className="bg-background/50"
                      />
                    </div>

                    {profile && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Kayıt Tarihi</Label>
                        <div className="text-sm px-3 py-2 border rounded-md bg-muted/20 text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4 opacity-50" />
                          {new Date(profile.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Hakkında</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Kendinizden bahsedin..."
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                {/* 2. GÜVENLİK AYARLARI */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 text-destructive-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    Hesap & Güvenlik
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresi</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@ornek.com"
                        className="bg-background/50"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        * Değiştirirseniz doğrulama e-postası alırsınız.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Yeni Şifre (İsteğe Bağlı)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-background/50"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        * Sadece değiştirmek istiyorsanız doldurun.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Değişiklikleri Kaydet
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="flex-1"
                  >
                    Çıkış Yap
                  </Button>
                </div>
              </TabsContent>

              {/* Reading Stats Tab */}
              <TabsContent value="stats" className="mt-6">
                {readingStats ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <Eye className="w-8 h-8 text-primary" />
                            <div>
                              <p className="text-2xl font-bold">{readingStats.totalViews}</p>
                              <p className="text-xs text-muted-foreground">Toplam Görüntüleme</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-primary" />
                            <div>
                              <p className="text-2xl font-bold">
                                {Math.floor(readingStats.totalReadingTime / 60)}dk
                              </p>
                              <p className="text-xs text-muted-foreground">Toplam Okuma Süresi</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(readingStats.categoryStats).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Kategori Dağılımı
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(readingStats.categoryStats)
                            .sort((a, b) => b[1].views - a[1].views)
                            .slice(0, 5)
                            .map(([category, stats]) => (
                              <div key={category} className="flex items-center justify-between p-2 bg-muted/60 rounded-lg">
                                <span className="text-sm">{categoryLabels[category as keyof typeof categoryLabels] || category}</span>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary">{stats.views} okuma</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.floor(stats.time / 60)}dk
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    {readingStats.recentViews.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Son Okunanlar</h4>
                        <div className="space-y-2">
                          {readingStats.recentViews.slice(0, 5).map((view, index) => (
                            <div
                              key={index}
                              className="p-2 bg-muted/60 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => navigate(`/news/${view.newsId}`)}
                            >
                              <p className="text-sm font-medium truncate">{view.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true, locale: tr })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz okuma istatistiğiniz yok.</p>
                  </div>
                )}
              </TabsContent>

              {/* Saved News Tab */}
              <TabsContent value="saved" className="mt-6">
                {isLoadingActivity ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : savedNewsItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz kaydettiğiniz haber yok.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedNewsItems.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between p-3 bg-muted/60 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => navigate(`/news/${saved.news_id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {saved.news?.title || 'Haber silinmiş'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(saved.created_at), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSaved(saved.news_id);
                          }}
                        >
                          <Bookmark className="h-4 w-4 fill-primary text-primary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="likes" className="mt-6">
                {isLoadingActivity ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : likedNews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz beğendiğiniz haber yok.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {likedNews.map((like) => (
                      <div key={like.id} className="flex items-center justify-between p-3 bg-muted/60 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {like.news?.title || 'Haber silinmiş'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(like.created_at), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleUnlike(like.id)}>
                          <Heart className="h-4 w-4 fill-destructive text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                {isLoadingActivity ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz yorum yapmadınız.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-muted/60 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {comment.news?.title || 'Haber silinmiş'}
                            </p>
                            <p className="text-sm">{comment.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
