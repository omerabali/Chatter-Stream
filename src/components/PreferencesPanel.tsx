import { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Plus, X, Loader2 } from 'lucide-react';
import { categoryLabels } from '@/data/mockNews';

const CATEGORIES = [
  'general',
  'business',
  'technology',
  'sports',
  'health',
  'entertainment',
  'science',
];

export const PreferencesPanel = () => {
  const { user } = useAuth();
  const { preferences, isLoading, toggleCategory, addKeyword, removeKeyword } = useUserPreferences();
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      await addKeyword(newKeyword.trim().toLowerCase());
      setNewKeyword('');
    }
  };

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Kişiselleştirme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Kişiselleştirilmiş haber akışı için giriş yapın.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" />
          Tercihlerim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Favorite Categories */}
        <div>
          <h4 className="text-sm font-medium mb-3">Favori Kategoriler</h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const isSelected = preferences?.favorite_categories?.includes(category);
              return (
                <Badge
                  key={category}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Favorite Keywords */}
        <div>
          <h4 className="text-sm font-medium mb-3">Anahtar Kelimeler</h4>
          <form onSubmit={handleAddKeyword} className="flex gap-2 mb-3">
            <Input
              placeholder="Yeni kelime ekle..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !newKeyword.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {preferences?.favorite_keywords?.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="flex items-center gap-1"
              >
                #{keyword}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeKeyword(keyword)}
                />
              </Badge>
            ))}
            {(!preferences?.favorite_keywords || preferences.favorite_keywords.length === 0) && (
              <span className="text-xs text-muted-foreground">
                Henüz anahtar kelime eklenmemiş
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
