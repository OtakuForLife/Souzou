import { expect, test, vi, afterEach, beforeEach, describe } from "vitest"
import themeReducer, * as ThemeSlice from "@/store/slices/themeSlice";
import { Theme, ThemeColors } from "@/types/themeTypes";

const {
  setCurrentTheme,
  startCustomization,
  updateCustomizationColor,
  cancelCustomization,
  clearError,
  fetchThemes,
  createCustomTheme,
  deleteTheme
} = ThemeSlice;

type ThemeState = ThemeSlice.ThemeState;

// Mock localStorage
const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

// Mock theme service
vi.mock('@/services/themeService', () => ({
  themeService: {
    fetchThemes: vi.fn(),
    createTheme: vi.fn(),
    deleteTheme: vi.fn(),
  }
}));

// Sample theme data for testing
const mockThemeColors: ThemeColors = {
  sidebar: {
    background: '#f8fafc',
    text: '#1f2937',
  },
  explorer: {
    background: '#ffffff',
    item: {
      background: {
        hover: '#f1f5f9',
      },
      text: {
        default: '#1f2937',
        hover: '#3b82f6',
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
        text: '#3b82f6',
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
    }
  }
};

const mockLightTheme: Theme = {
  id: 'light-theme-id',
  name: 'Light',
  type: 'predefined',
  isDefault: true,
  colors: mockThemeColors,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockDarkTheme: Theme = {
  id: 'dark-theme-id',
  name: 'Dark',
  type: 'predefined',
  isDefault: false,
  colors: {
    sidebar: {
      background: '#1f2937',
      text: '#f9fafb',
    },
    explorer: {
      background: '#111827',
      item: {
        background: {
          hover: '#374151',
        },
        text: {
          default: '#f9fafb',
          hover: '#60a5fa',
        },
      },
    },
    main: {
      tabs: {
        background: '#1f2937',
      },
      tab: {
        text: {
          default: '#9ca3af',
          hover: '#f9fafb',
        },
        background: {
          default: '#111827',
          hover: '#374151',
        },
        active: {
          text: '#60a5fa',
          background: '#111827',
        },
      },
      content: {
        background: '#111827',
        text: '#f9fafb',
      },
    },
    editor: {
      background: '#1f2937',
      text: '#f9fafb',
      selection: '#60a5fa20',
      cursor: '#60a5fa',
      lineNumber: '#6b7280',
      syntax: {
        keyword: '#a78bfa',
        string: '#34d399',
        comment: '#6b7280',
        function: '#f87171',
        variable: '#f9fafb',
      }
    }
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const initialState: ThemeState = {
  allThemes: {},
  predefinedThemes: [],
  customThemes: [],
  currentThemeId: null,
  loading: false,
  error: null,
  isCustomizing: false,
  customizationDraft: null,
};

describe('Theme Slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    getItemSpy.mockClear();
    setItemSpy.mockClear();
  });

  describe('setCurrentTheme', () => {
    test('should set current theme ID and save to localStorage', () => {
      const themeId = 'light-theme-id';

      const nextState = themeReducer(initialState, setCurrentTheme(themeId));

      expect(nextState.currentThemeId).toBe(themeId);
      expect(setItemSpy).toHaveBeenCalledWith('currentThemeId', themeId);
    });
  });

  describe('startCustomization', () => {
    test('should start customization with base theme colors', () => {
      const stateWithTheme: ThemeState = {
        ...initialState,
        allThemes: {
          [mockLightTheme.id]: mockLightTheme,
        },
      };

      const nextState = themeReducer(stateWithTheme, startCustomization(mockLightTheme.id));

      expect(nextState.isCustomizing).toBe(true);
      expect(nextState.customizationDraft).toEqual(mockLightTheme.colors);
    });
  });

  describe('updateCustomizationColor', () => {
    test('should update color in customization draft', () => {
      const stateWithCustomization: ThemeState = {
        ...initialState,
        isCustomizing: true,
        customizationDraft: { ...mockThemeColors },
      };

      const nextState = themeReducer(
        stateWithCustomization,
        updateCustomizationColor({ path: 'sidebar.background', color: '#ff0000' })
      );

      expect((nextState.customizationDraft as any)?.sidebar?.background).toBe('#ff0000');
    });

    test('should update nested color in customization draft', () => {
      const stateWithCustomization: ThemeState = {
        ...initialState,
        isCustomizing: true,
        customizationDraft: { ...mockThemeColors },
      };

      const nextState = themeReducer(
        stateWithCustomization,
        updateCustomizationColor({ path: 'editor.syntax.keyword', color: '#ff0000' })
      );

      expect((nextState.customizationDraft as any)?.editor?.syntax?.keyword).toBe('#ff0000');
    });
  });

  describe('cancelCustomization', () => {
    test('should cancel customization and clear draft', () => {
      const stateWithCustomization: ThemeState = {
        ...initialState,
        isCustomizing: true,
        customizationDraft: { ...mockThemeColors },
      };

      const nextState = themeReducer(stateWithCustomization, cancelCustomization());

      expect(nextState.isCustomizing).toBe(false);
      expect(nextState.customizationDraft).toBe(null);
    });
  });

  describe('clearError', () => {
    test('should clear error state', () => {
      const stateWithError: ThemeState = {
        ...initialState,
        error: 'Some error message',
      };

      const nextState = themeReducer(stateWithError, clearError());

      expect(nextState.error).toBe(null);
    });
  });

  describe('fetchThemes async action', () => {
    test('should handle fetchThemes.pending', () => {
      const action = { type: fetchThemes.pending.type };
      const nextState = themeReducer(initialState, action);

      expect(nextState.loading).toBe(true);
      expect(nextState.error).toBe(null);
    });

    test('should handle fetchThemes.fulfilled', () => {
      const themes = [mockLightTheme, mockDarkTheme];
      const action = {
        type: fetchThemes.fulfilled.type,
        payload: themes
      };

      const nextState = themeReducer(initialState, action);

      expect(nextState.loading).toBe(false);
      expect(nextState.allThemes[mockLightTheme.id]).toEqual(mockLightTheme);
      expect(nextState.allThemes[mockDarkTheme.id]).toEqual(mockDarkTheme);
      expect(nextState.predefinedThemes).toContain(mockLightTheme.id);
      expect(nextState.predefinedThemes).toContain(mockDarkTheme.id);
      expect(nextState.currentThemeId).toBe(mockLightTheme.id); // Default theme
    });

    test('should handle fetchThemes.rejected', () => {
      const action = {
        type: fetchThemes.rejected.type,
        error: { message: 'Failed to fetch themes' }
      };

      const nextState = themeReducer(initialState, action);

      expect(nextState.loading).toBe(false);
      expect(nextState.error).toBe('Failed to fetch themes');
    });
  });

  describe('createCustomTheme async action', () => {
    test('should handle createCustomTheme.fulfilled', () => {
      const customTheme: Theme = {
        ...mockLightTheme,
        id: 'custom-theme-id',
        name: 'Custom Theme',
        type: 'custom',
        isDefault: false,
      };

      const stateWithCustomization: ThemeState = {
        ...initialState,
        isCustomizing: true,
        customizationDraft: mockThemeColors,
      };

      const action = {
        type: createCustomTheme.fulfilled.type,
        payload: customTheme
      };

      const nextState = themeReducer(stateWithCustomization, action);

      expect(nextState.allThemes[customTheme.id]).toEqual(customTheme);
      expect(nextState.customThemes).toContain(customTheme.id);
      expect(nextState.isCustomizing).toBe(false);
      expect(nextState.customizationDraft).toBe(null);
    });
  });

  describe('deleteTheme async action', () => {
    test('should handle deleteTheme.fulfilled', () => {
      const stateWithThemes: ThemeState = {
        ...initialState,
        allThemes: {
          [mockLightTheme.id]: mockLightTheme,
          [mockDarkTheme.id]: mockDarkTheme,
        },
        predefinedThemes: [mockLightTheme.id, mockDarkTheme.id],
        currentThemeId: mockDarkTheme.id,
      };

      const action = {
        type: deleteTheme.fulfilled.type,
        payload: mockDarkTheme.id
      };

      const nextState = themeReducer(stateWithThemes, action);

      expect(nextState.allThemes[mockDarkTheme.id]).toBeUndefined();
      expect(nextState.predefinedThemes).not.toContain(mockDarkTheme.id);
      expect(nextState.currentThemeId).toBe(mockLightTheme.id); // Switched to default
    });
  });
});