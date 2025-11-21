import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks';
import { createCustomTheme, setCurrentTheme } from '@/store/slices/themeSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Palette } from 'lucide-react';
import { Theme, ThemeColors, THEME_COLORS_SCHEMA } from '@/types/themeTypes';
import { ThemeItem } from './ThemeItem';
import { Label } from './ui/label';
import {
  createDefaultThemeColors,
  flattenSchema,
  groupFieldsBySection,
  getByPath,
  setByPath,
  getSectionName
} from '@/utils/themeSchemaUtils';

interface ThemeManagerProps {
  children: React.ReactNode;
}

interface NewTheme {
  name: string;
  colors: Partial<ThemeColors>;
}

// Generate all color fields from schema
const allColorFields = flattenSchema(THEME_COLORS_SCHEMA);
const fieldsBySection = groupFieldsBySection(allColorFields);

export const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { allThemes, currentThemeId, loading } = useSelector((state: RootState) => state.themes);
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTheme, setNewTheme] = useState<NewTheme>({
    name: '',
    colors: createDefaultThemeColors(),
  });

  const createNewTheme = async () => {
    if (!newTheme.name.trim()) return;

    try {
      await dispatch(createCustomTheme({
        name: newTheme.name,
        colors: newTheme.colors as ThemeColors,
        custom: true,
      }));

      // Reset form
      setNewTheme({
        name: '',
        colors: createDefaultThemeColors(),
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create theme:', error);
    }
  };

  // Helper to update a color field by path
  const updateColorField = (path: string[], value: string) => {
    setNewTheme({
      ...newTheme,
      colors: setByPath(newTheme.colors, path, value)
    });
  };

  const handleThemeSelect = (themeId: string) => {
    dispatch(setCurrentTheme(themeId));
  };

  const themes = Object.values(allThemes);
  const predefinedThemes = themes.filter(t => !t.custom);
  const customThemes = themes.filter(t => t.custom);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="!max-w-none w-1/2 h-2/3 theme-explorer-background theme-explorer-item-text flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Manager
          </DialogTitle>
          <DialogDescription>
            Select a theme or create custom themes with your own colors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          {/* Create New Theme Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Themes</h3>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          </div>

          {/* Create Theme Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20 max-h-96 overflow-y-auto">
              <h4 className="font-medium">Create New Theme</h4>

              <div>
                <Label className="text-sm font-medium">Theme Name</Label>
                <Input
                  value={newTheme.name}
                  onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                  placeholder="My Custom Theme"
                  className="mt-1"
                />
              </div>

              {/* Color Inputs - Generated from schema */}
              {Object.entries(fieldsBySection).map(([section, fields]) => (
                <div key={section} className="space-y-3">
                  <h5 className="text-sm font-semibold">{getSectionName([section])} Colors</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {fields.map(field => (
                      <div key={field.path.join('.')}>
                        <Label className="text-xs">{field.label}</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={getByPath(newTheme.colors, field.path) || field.default}
                            onChange={(e) => updateColorField(field.path, e.target.value)}
                            className="w-12 h-8 p-1"
                          />
                          <Input
                            value={getByPath(newTheme.colors, field.path) || field.default}
                            onChange={(e) => updateColorField(field.path, e.target.value)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button onClick={createNewTheme} disabled={!newTheme.name.trim()}>
                  Create Theme
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTheme({
                      name: '',
                      colors: createDefaultThemeColors(),
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Separator />
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-6 px-6">
            {loading ? (
              <div className="text-center py-8">Loading themes...</div>
            ) : (
              <>
                {/* Predefined Themes */}
                {predefinedThemes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Predefined Themes</h4>
                    <div className="space-y-2">
                      {predefinedThemes.map((theme: Theme) => (
                        <ThemeItem
                          key={theme.id}
                          theme={theme}
                          isActive={theme.id === currentThemeId}
                          onSelect={handleThemeSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Custom Themes</h4>
                    <div className="space-y-2">
                      {customThemes.map((theme: Theme) => (
                        <ThemeItem
                          key={theme.id}
                          theme={theme}
                          isActive={theme.id === currentThemeId}
                          onSelect={handleThemeSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {themes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No themes found. Create your first theme to get started.
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

