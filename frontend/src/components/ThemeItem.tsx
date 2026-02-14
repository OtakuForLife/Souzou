import React, { useState } from 'react';
import { Theme, ThemeColors } from '@/types/themeTypes';
import { useAppDispatch } from '@/hooks';
import { updateTheme, deleteTheme } from '@/store/slices/themeSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Edit, Trash2, X, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeColorEditor } from './ThemeColorEditor';
import { setByPath } from '@/utils/themeSchemaUtils';

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

  // Helper to update a color field by key
  const updateColorField = (key: string, value: string) => {
    setEditedTheme({
      ...editedTheme,
      colors: setByPath(editedTheme.colors, key, value)
    });
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

        {/* Color Editors - Generated from schema */}
        <ThemeColorEditor
          colors={editedTheme.colors}
          onColorChange={updateColorField}
          showScrollArea={true}
          scrollHeight="400px"
        />
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

