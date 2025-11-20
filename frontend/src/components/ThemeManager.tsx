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
import { Theme, ThemeColors } from '@/types/themeTypes';
import { ThemeItem } from './ThemeItem';
import { Label } from './ui/label';

interface ThemeManagerProps {
  children: React.ReactNode;
}

interface NewTheme {
  name: string;
  colors: Partial<ThemeColors>;
}

// Default color structure based on create_default_themes.py
const getDefaultColors = (): ThemeColors => ({
  sidebar: {
    background: '#ffffff',
    text: '#1f2937',
  },
  explorer: {
    background: '#f8fafc',
    item: {
      background: {
        hover: '#f1f5f9',
      },
      text: {
        default: '#1f2937',
        hover: '#1f2937',
      },
    },
  },
  main: {
    tabs: {
      background: '#f8fafc',
    },
    tab: {
      text: {
        default: '#6b7280',
        hover: '#1f2937',
      },
      background: {
        default: '#ffffff',
        hover: '#f1f5f9',
      },
      active: {
        text: '#1f2937',
        background: '#ffffff',
      },
    },
    content: {
      background: '#ffffff',
      text: '#1f2937',
    },
  },
  editor: {
    background: '#ffffff',
    text: '#1f2937',
    selection: '#3b82f620',
    cursor: '#3b82f6',
    lineNumber: '#9ca3af',
    syntax: {
      keyword: '#7c3aed',
      string: '#059669',
      comment: '#6b7280',
      function: '#dc2626',
      variable: '#1f2937',
    },
  },
});

export const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { allThemes, currentThemeId, loading } = useSelector((state: RootState) => state.themes);
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTheme, setNewTheme] = useState<NewTheme>({
    name: '',
    colors: getDefaultColors(),
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
        colors: getDefaultColors(),
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create theme:', error);
    }
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

              {/* Color Inputs - Organized by section */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold">Sidebar Colors</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.sidebar?.background || '#ffffff'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            sidebar: { ...newTheme.colors.sidebar!, background: e.target.value }
                          }
                        })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.sidebar?.background || '#ffffff'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            sidebar: { ...newTheme.colors.sidebar!, background: e.target.value }
                          }
                        })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Text</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.sidebar?.text || '#1f2937'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            sidebar: { ...newTheme.colors.sidebar!, text: e.target.value }
                          }
                        })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.sidebar?.text || '#1f2937'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            sidebar: { ...newTheme.colors.sidebar!, text: e.target.value }
                          }
                        })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold">Explorer Colors</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.explorer?.background || '#f8fafc'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            explorer: { ...newTheme.colors.explorer!, background: e.target.value }
                          }
                        })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.explorer?.background || '#f8fafc'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            explorer: { ...newTheme.colors.explorer!, background: e.target.value }
                          }
                        })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Item Hover BG</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.explorer?.item?.background?.hover || '#f1f5f9'}
                        onChange={(e) => {
                          const explorer = newTheme.colors.explorer || { background: '#f8fafc', item: { background: { hover: '#f1f5f9' }, text: { default: '#1f2937', hover: '#1f2937' } } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              explorer: {
                                ...explorer,
                                item: {
                                  ...explorer.item,
                                  background: {
                                    ...explorer.item.background,
                                    hover: e.target.value
                                  }
                                }
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.explorer?.item?.background?.hover || '#f1f5f9'}
                        className="flex-1 text-xs"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold">Main Content Colors</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tabs Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.main?.tabs?.background || '#f8fafc'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tabs: {
                                  background: e.target.value
                                },
                                tab: main.tab,
                                content: main.content
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.main?.tabs?.background || '#f8fafc'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tabs: {
                                  background: e.target.value
                                },
                                tab: main.tab,
                                content: main.content
                              }
                            }
                          });
                        }}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Tab Active BG</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.main?.tab?.active?.background || '#ffffff'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tab: {
                                  ...main.tab,
                                  active: {
                                    ...main.tab.active,
                                    background: e.target.value
                                  }
                                }
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.main?.tab?.active?.background || '#ffffff'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tab: {
                                  ...main.tab,
                                  active: {
                                    ...main.tab.active,
                                    background: e.target.value
                                  }
                                }
                              }
                            }
                          });
                        }}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Tab Active Text</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.main?.tab?.active?.text || '#1f2937'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tab: {
                                  ...main.tab,
                                  active: {
                                    ...main.tab.active,
                                    text: e.target.value
                                  }
                                }
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.main?.tab?.active?.text || '#1f2937'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                tab: {
                                  ...main.tab,
                                  active: {
                                    ...main.tab.active,
                                    text: e.target.value
                                  }
                                }
                              }
                            }
                          });
                        }}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Content Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.main?.content?.background || '#ffffff'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                content: {
                                  ...main.content,
                                  background: e.target.value
                                }
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.main?.content?.background || '#ffffff'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                content: {
                                  ...main.content,
                                  background: e.target.value
                                }
                              }
                            }
                          });
                        }}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Content Text</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.main?.content?.text || '#1f2937'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                content: {
                                  ...main.content,
                                  text: e.target.value
                                }
                              }
                            }
                          });
                        }}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.main?.content?.text || '#1f2937'}
                        onChange={(e) => {
                          const main = newTheme.colors.main || { tabs: { background: '#f8fafc' }, tab: { text: { default: '#6b7280', hover: '#1f2937' }, background: { default: '#ffffff', hover: '#f1f5f9' }, active: { text: '#1f2937', background: '#ffffff' } }, content: { background: '#ffffff', text: '#1f2937' } };
                          setNewTheme({
                            ...newTheme,
                            colors: {
                              ...newTheme.colors,
                              main: {
                                ...main,
                                content: {
                                  ...main.content,
                                  text: e.target.value
                                }
                              }
                            }
                          });
                        }}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold">Editor Colors</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Background</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.editor?.background || '#ffffff'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            editor: { ...newTheme.colors.editor!, background: e.target.value }
                          }
                        })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.editor?.background || '#ffffff'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            editor: { ...newTheme.colors.editor!, background: e.target.value }
                          }
                        })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Text</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={newTheme.colors.editor?.text || '#1f2937'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            editor: { ...newTheme.colors.editor!, text: e.target.value }
                          }
                        })}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTheme.colors.editor?.text || '#1f2937'}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          colors: {
                            ...newTheme.colors,
                            editor: { ...newTheme.colors.editor!, text: e.target.value }
                          }
                        })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                      colors: getDefaultColors(),
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

