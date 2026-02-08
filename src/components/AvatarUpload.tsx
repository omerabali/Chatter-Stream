import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, User } from 'lucide-react';

interface AvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  displayName?: string;
}

export const AvatarUpload = ({ avatarUrl, onAvatarChange, displayName }: AvatarUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir resim dosyası seçin.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Hata',
        description: 'Dosya boyutu 2MB\'dan küçük olmalıdır.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file path with user id
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      
      onAvatarChange(urlWithCacheBuster);

      toast({
        title: 'Başarılı',
        description: 'Avatar güncellendi.',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Hata',
        description: 'Avatar yüklenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className="w-24 h-24 border-2 border-border">
          <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Değiştirmek için kameraya tıklayın
      </p>
    </div>
  );
};
