import React, { useState } from 'react';
import { Theme, ThemeColors } from '@/types/themeTypes';
import { useAppDispatch } from '@/hooks';
import { updateTheme, deleteTheme } from '@/store/slices/themeSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Edit, Trash2, X, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ThemeItemProps {
  theme: Theme;
  isActive: boolean;
  onSelect: (themeId: string) => void;
}

export const ThemeItem: React.FC<ThemeItemProps> = ({ theme, isActive, onSelect }) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState<Theme>(theme);

  const handleSave = async () => {
    try {
      await dispatch(updateTheme({
        themeId: theme.id,
        name: editedTheme.name,
        colors: editedTheme.colors,
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the theme "${theme.name}"?`)) {
      return;
    }

    try {
      await dispatch(deleteTheme(theme.id));
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };

  const handleCancel = () => {
    setEditedTheme(theme);
    setIsEditing(false);
  };

  const updateColor = (path: string, value: string) => {
    const pathParts = path.split('.');

    // Deep clone the colors object to avoid mutating read-only properties
    const newColors = JSON.parse(JSON.stringify(editedTheme.colors));
    let current: any = newColors;

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    setEditedTheme({ ...editedTheme, colors: newColors as ThemeColors });
  };

  if (isEditing) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={editedTheme.name}
            onChange={(e) => setEditedTheme({ ...editedTheme, name: e.target.value })}
            className="flex-1 mr-2"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Color Editors */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold">Sidebar</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.sidebar?.background || '#ffffff'}
                    onChange={(e) => updateColor('sidebar.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.sidebar?.background || '#ffffff'}
                    onChange={(e) => updateColor('sidebar.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.sidebar?.text || '#1f2937'}
                    onChange={(e) => updateColor('sidebar.text', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.sidebar?.text || '#1f2937'}
                    onChange={(e) => updateColor('sidebar.text', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Explorer</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.explorer?.background || '#f8fafc'}
                    onChange={(e) => updateColor('explorer.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.explorer?.background || '#f8fafc'}
                    onChange={(e) => updateColor('explorer.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Item Hover BG</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.explorer?.item?.background?.hover || '#f1f5f9'}
                    onChange={(e) => updateColor('explorer.item.background.hover', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.explorer?.item?.background?.hover || '#f1f5f9'}
                    onChange={(e) => updateColor('explorer.item.background.hover', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Main - Tabs</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Tabs BG</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.main?.tabs?.background || '#f8fafc'}
                    onChange={(e) => updateColor('main.tabs.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.main?.tabs?.background || '#f8fafc'}
                    onChange={(e) => updateColor('main.tabs.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tab Active BG</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.main?.tab?.active?.background || '#ffffff'}
                    onChange={(e) => updateColor('main.tab.active.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.main?.tab?.active?.background || '#ffffff'}
                    onChange={(e) => updateColor('main.tab.active.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tab Active Text</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.main?.tab?.active?.text || '#1f2937'}
                    onChange={(e) => updateColor('main.tab.active.text', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.main?.tab?.active?.text || '#1f2937'}
                    onChange={(e) => updateColor('main.tab.active.text', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Main - Content</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Content BG</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.main?.content?.background || '#ffffff'}
                    onChange={(e) => updateColor('main.content.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.main?.content?.background || '#ffffff'}
                    onChange={(e) => updateColor('main.content.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Content Text</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.main?.content?.text || '#1f2937'}
                    onChange={(e) => updateColor('main.content.text', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.main?.content?.text || '#1f2937'}
                    onChange={(e) => updateColor('main.content.text', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Editor</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.editor?.background || '#ffffff'}
                    onChange={(e) => updateColor('editor.background', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.editor?.background || '#ffffff'}
                    onChange={(e) => updateColor('editor.background', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Text</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={editedTheme.colors.editor?.text || '#1f2937'}
                    onChange={(e) => updateColor('editor.text', e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={editedTheme.colors.editor?.text || '#1f2937'}
                    onChange={(e) => updateColor('editor.text', e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(theme.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {isActive && <Check className="w-4 h-4 text-primary" />}
          <div>
            <div className="font-medium">{theme.name}</div>
          </div>
        </div>

        {theme.custom && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

