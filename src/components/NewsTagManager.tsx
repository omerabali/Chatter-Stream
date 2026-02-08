import { useState } from 'react';
import { Tag, Plus, X, Edit2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNewsTags } from '@/hooks/useNewsTags';
import { useAuth } from '@/hooks/useAuth';

const TAG_COLORS = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

interface NewsTagManagerProps {
  newsId: string;
  compact?: boolean;
}

export function NewsTagManager({ newsId, compact = false }: NewsTagManagerProps) {
  const { user } = useAuth();
  const { tags, getTagsForNews, createTag, assignTag, removeTagFromNews, deleteTag, updateTag } = useNewsTags();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (!user) return null;

  const assignedTags = getTagsForNews(newsId);
  const unassignedTags = tags.filter(t => !assignedTags.some(at => at.id === t.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const created = await createTag(newTagName, newTagColor);
    if (created) {
      await assignTag(newsId, created.id);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
    }
  };

  const handleAssignTag = async (tagId: string) => {
    await assignTag(newsId, tagId);
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromNews(newsId, tagId);
  };

  const startEditTag = (tag: { id: string; name: string; color: string }) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEditTag = async () => {
    if (editingTag && editName.trim()) {
      await updateTag(editingTag, editName, editColor);
      setEditingTag(null);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {assignedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="outline"
            style={{ borderColor: tag.color, color: tag.color }}
            className="text-xs"
          >
            {tag.name}
          </Badge>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Tag className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <TagPopoverContent
              assignedTags={assignedTags}
              unassignedTags={unassignedTags}
              newTagName={newTagName}
              setNewTagName={setNewTagName}
              newTagColor={newTagColor}
              setNewTagColor={setNewTagColor}
              editingTag={editingTag}
              editName={editName}
              setEditName={setEditName}
              editColor={editColor}
              setEditColor={setEditColor}
              handleCreateTag={handleCreateTag}
              handleAssignTag={handleAssignTag}
              handleRemoveTag={handleRemoveTag}
              startEditTag={startEditTag}
              saveEditTag={saveEditTag}
              deleteTag={deleteTag}
              setEditingTag={setEditingTag}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="w-4 h-4" />
          Etiketler ({assignedTags.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <TagPopoverContent
          assignedTags={assignedTags}
          unassignedTags={unassignedTags}
          newTagName={newTagName}
          setNewTagName={setNewTagName}
          newTagColor={newTagColor}
          setNewTagColor={setNewTagColor}
          editingTag={editingTag}
          editName={editName}
          setEditName={setEditName}
          editColor={editColor}
          setEditColor={setEditColor}
          handleCreateTag={handleCreateTag}
          handleAssignTag={handleAssignTag}
          handleRemoveTag={handleRemoveTag}
          startEditTag={startEditTag}
          saveEditTag={saveEditTag}
          deleteTag={deleteTag}
          setEditingTag={setEditingTag}
        />
      </PopoverContent>
    </Popover>
  );
}

interface TagPopoverContentProps {
  assignedTags: { id: string; name: string; color: string }[];
  unassignedTags: { id: string; name: string; color: string }[];
  newTagName: string;
  setNewTagName: (v: string) => void;
  newTagColor: string;
  setNewTagColor: (v: string) => void;
  editingTag: string | null;
  editName: string;
  setEditName: (v: string) => void;
  editColor: string;
  setEditColor: (v: string) => void;
  handleCreateTag: () => void;
  handleAssignTag: (id: string) => void;
  handleRemoveTag: (id: string) => void;
  startEditTag: (tag: { id: string; name: string; color: string }) => void;
  saveEditTag: () => void;
  deleteTag: (id: string) => void;
  setEditingTag: (id: string | null) => void;
}

function TagPopoverContent({
  assignedTags,
  unassignedTags,
  newTagName,
  setNewTagName,
  newTagColor,
  setNewTagColor,
  editingTag,
  editName,
  setEditName,
  editColor,
  setEditColor,
  handleCreateTag,
  handleAssignTag,
  handleRemoveTag,
  startEditTag,
  saveEditTag,
  deleteTag,
  setEditingTag,
}: TagPopoverContentProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Etiket Yönetimi</h4>

      {/* Assigned tags */}
      {assignedTags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Atanmış</p>
          <div className="flex flex-wrap gap-1">
            {assignedTags.map(tag => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
                className="gap-1 cursor-pointer group"
              >
                {editingTag === tag.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-5 w-20 text-xs px-1"
                      autoFocus
                    />
                    <Check
                      className="w-3 h-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEditTag();
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {tag.name}
                    <X
                      className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag.id);
                      }}
                    />
                  </>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned tags */}
      {unassignedTags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mevcut Etiketler</p>
          <div className="flex flex-wrap gap-1">
            {unassignedTags.map(tag => (
              <div key={tag.id} className="flex items-center gap-0.5 group">
                <Badge
                  variant="outline"
                  style={{ borderColor: tag.color, color: tag.color }}
                  className="cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => handleAssignTag(tag.id)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {tag.name}
                </Badge>
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <Edit2
                    className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => startEditTag(tag)}
                  />
                  <Trash2
                    className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTag(tag.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create new tag */}
      <div className="space-y-2 border-t pt-2">
        <p className="text-xs text-muted-foreground">Yeni Etiket</p>
        <div className="flex gap-2">
          <Input
            placeholder="Etiket adı"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
          />
          <Button size="sm" onClick={handleCreateTag} className="h-8 px-2">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {TAG_COLORS.map(color => (
            <button
              key={color}
              className={`w-5 h-5 rounded-full transition-transform ${
                newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setNewTagColor(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
