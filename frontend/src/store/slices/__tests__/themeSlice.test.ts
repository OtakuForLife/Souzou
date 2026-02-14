import { expect, test, vi, afterEach, beforeEach, describe } from "vitest"
import themeReducer, * as ThemeSlice from "@/store/slices/themeSlice";
import { Theme, ThemeColors } from "@/types/themeTypes";
import { STORAGE_KEYS } from "@/config/constants";

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
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

const getItemSpy = localStorageMock.getItem;
const setItemSpy = localStorageMock.setItem;

// Mock theme service
vi.mock('@/services/themeService', () => ({
  themeService: {
    fetchThemes: vi.fn(),
    createTheme: vi.fn(),
    deleteTheme: vi.fn(),
  }
}));

// Sample theme data for testing (FLAT structure)
const mockThemeColors: ThemeColors = {
  '--color-surface-0': '#ffffff',
  '--color-surface-0-hover': '#f8fafc',
  '--color-surface-1': '#f8fafc',
  '--color-surface-1-hover': '#f1f5f9',
  '--color-surface-2': '#f8fafc',
  '--color-surface-2-hover': '#f1f5f9',

  '--color-text-primary': '#1f2937',
  '--color-text-primary-hover': '#1f2937',
  '--color-text-secondary': '#6b7280',
  '--color-text-secondary-hover': '#374151',
  '--color-text-tertiary': '#9ca3af',
  '--color-text-tertiary-hover': '#374151',

  '--color-tab-active': '#ffffff',
  '--color-tab-active-hover': '#ffffff',
  '--color-tab-inactive': '#f8fafc',
  '--color-tab-inactive-hover': '#f1f5f9',

  '--color-border-primary': '#e5e7eb',

  '--color-button-primary': '#3b82f6',
  '--color-button-primary-hover': '#2563eb',
  '--color-button-primary-clicked': '#1d4ed8',

  '--color-button-alert': '#ef4444',
  '--color-button-alert-hover': '#dc2626',
  '--color-button-alert-clicked': '#b91c1c',
};

const mockLightTheme: Theme = {
  id: 'light-theme-id',
  name: 'Light',
  custom: false,
  isDefault: true,
  colors: mockThemeColors,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockDarkTheme: Theme = {
  id: 'dark-theme-id',
  name: 'Dark',
  custom: false,
  isDefault: false,
  colors: {
    '--color-surface-0': '#111827',
    '--color-surface-0-hover': '#1f2937',
    '--color-surface-1': '#1f2937',
    '--color-surface-1-hover': '#374151',
    '--color-surface-2': '#1f2937',
    '--color-surface-2-hover': '#374151',

    '--color-text-primary': '#f9fafb',
    '--color-text-primary-hover': '#f9fafb',
    '--color-text-secondary': '#9ca3af',
    '--color-text-secondary-hover': '#f9fafb',
    '--color-text-tertiary': '#6b7280',
    '--color-text-tertiary-hover': '#9ca3af',

    '--color-tab-active': '#111827',
    '--color-tab-active-hover': '#111827',
    '--color-tab-inactive': '#1f2937',
    '--color-tab-inactive-hover': '#374151',

    '--color-border-primary': '#374151',

    '--color-button-primary': '#60a5fa',
    '--color-button-primary-hover': '#3b82f6',
    '--color-button-primary-clicked': '#2563eb',

    '--color-button-alert': '#f87171',
    '--color-button-alert-hover': '#ef4444',
    '--color-button-alert-clicked': '#dc2626',
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
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEYS.THEME, themeId);
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
        custom: true,
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