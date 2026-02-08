import { Zap, LogIn, LogOut, Shield, User, TrendingUp, Download, Archive, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { LiveNewsIndicator } from './LiveNewsIndicator';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10 bg-[#020617] sticky top-0 z-50 backdrop-blur-md supports-[backdrop-filter]:bg-[#020617]/80">
      <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="w-16 h-16 flex items-center justify-center -ml-2">
              <img
                src="/argus-logo.png"
                alt="ARGUS"
                className="w-full h-full object-contain"
                style={{
                  maskImage: 'radial-gradient(circle, black 50%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 90%)'
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-1 font-orbitron">
              ARGUS
            </h1>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-1 md:gap-4">
          <LiveNewsIndicator />

          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
            <Button variant="ghost" size="sm" onClick={() => navigate('/archive')} className="h-8 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5">
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Arşiv
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/stats')} className="h-8 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              İstatistik
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trends')} className="h-8 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Trendler
            </Button>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-white/10">


            <ThemeToggle />
            <NotificationBell />

            {user ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="h-8 w-8 p-0">
                  <User className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="h-8 w-8 p-0 text-primary hover:text-primary">
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-black font-semibold h-8">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Giriş
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
