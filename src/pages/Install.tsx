import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Uygulamayı Yükle</h1>
          <p className="text-muted-foreground">
            ARGUS'u cihazınıza yükleyerek hızlı erişim sağlayın
          </p>
        </div>

        {isInstalled ? (
          <Card className="bg-success/10 border-success">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Uygulama Zaten Yüklü!</h3>
                <p className="text-sm text-muted-foreground">
                  ARGUS cihazınızda kullanıma hazır.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="w-5 h-5" />
                iOS Kurulum Adımları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Safari'nin paylaş butonuna tıklayın</p>
                  <p className="text-sm text-muted-foreground">
                    Ekranın altındaki <Share className="w-4 h-4 inline" /> simgesine tıklayın
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">"Ana Ekrana Ekle" seçeneğini bulun</p>
                  <p className="text-sm text-muted-foreground">
                    Menüde aşağı kaydırın ve <Plus className="w-4 h-4 inline" /> "Ana Ekrana Ekle"yi seçin
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">"Ekle" butonuna dokunun</p>
                  <p className="text-sm text-muted-foreground">
                    Uygulama ana ekranınıza eklenecek
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <Button
                size="lg"
                onClick={handleInstall}
                className="glow-primary"
              >
                <Download className="w-5 h-5 mr-2" />
                Uygulamayı Yükle
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Yükleme işlemi birkaç saniye sürecektir
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Tarayıcınız doğrudan yüklemeyi desteklemiyor.
              </p>
              <p className="text-sm text-muted-foreground">
                Tarayıcı menüsünden "Ana ekrana ekle" veya "Uygulama olarak yükle" seçeneğini kullanın.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="mt-8 grid gap-4">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Çevrimdışı Çalışma</p>
                <p className="text-sm text-muted-foreground">
                  İnternet olmadan da haberlere erişin
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Anında Bildirimler</p>
                <p className="text-sm text-muted-foreground">
                  Son dakika haberlerinden anında haberdar olun
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Hızlı Erişim</p>
                <p className="text-sm text-muted-foreground">
                  Ana ekrandan tek tıkla açın
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Install;
