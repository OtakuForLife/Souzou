
/**
 * Redux slice for theme management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Theme, ThemeColors } from '@/types/themeTypes';
import { themeService, CreateThemeRequest, UpdateThemeRequest } from '@/services/themeService';

export interface ThemeState {
  allThemes: { [id: string]: Theme };
  predefinedThemes: string[]; // Array of theme IDs
  customThemes: string[]; // Array of theme IDs
  currentThemeId: string | null;
  loading: boolean;
  error: string | null;
  isCustomizing: boolean;
  customizationDraft: Partial<ThemeColors> | null;
}

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

// Async thunks
export const fetchThemes = createAsyncThunk(
  'themes/fetchThemes',
  async () => {
    const themes = await themeService.fetchThemes();
    return themes;
  }
);

export const fetchDefaultTheme = createAsyncThunk(
  'themes/fetchDefaultTheme',
  async () => {
    const defaultTheme = await themeService.fetchDefaultTheme();
    return defaultTheme;
  }
);

export const createCustomTheme = createAsyncThunk(
  'themes/createCustomTheme',
  async (themeData: CreateThemeRequest) => {
    const newTheme = await themeService.createTheme(themeData);
    return newTheme;
  }
);

export const updateTheme = createAsyncThunk(
  'themes/updateTheme',
  async (updateData: UpdateThemeRequest) => {
    const updatedTheme = await themeService.updateTheme(updateData);
    return updatedTheme;
  }
);

export const deleteTheme = createAsyncThunk(
  'themes/deleteTheme',
  async (themeId: string) => {
    await themeService.deleteTheme(themeId);
    return themeId;
  }
);

const themeSlice = createSlice({
  name: 'themes',
  initialState,
  reducers: {
    setCurrentTheme: (state, action: PayloadAction<string>) => {
      state.currentThemeId = action.payload;
      // Store in localStorage for persistence
      localStorage.setItem('currentThemeId', action.payload);
    },

    startCustomization: (state, action: PayloadAction<string>) => {
      const baseTheme = state.allThemes[action.payload];
      if (baseTheme) {
        state.isCustomizing = true;
        state.customizationDraft = { ...baseTheme.colors };
      }
    },

    updateCustomizationColor: (state, action: PayloadAction<{ path: string; color: string }>) => {
      if (state.customizationDraft) {
        const { path, color } = action.payload;
        // Handle nested paths like 'text.primary' or 'editor.syntax.keyword'
        const pathParts = path.split('.');
        let current: any = state.customizationDraft;

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }

        current[pathParts[pathParts.length - 1]] = color;
      }
    },

    cancelCustomization: (state) => {
      state.isCustomizing = false;
      state.customizationDraft = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch themes
    builder
      .addCase(fetchThemes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThemes.fulfilled, (state, action) => {
        state.loading = false;

        // Reset arrays
        state.predefinedThemes = [];
        state.customThemes = [];

        // Process themes
        action.payload.forEach((theme) => {
          state.allThemes[theme.id] = theme;

          if (theme.type === 'predefined') {
            state.predefinedThemes.push(theme.id);
          } else {
            state.customThemes.push(theme.id);
          }
        });

        // Set current theme if not set
        if (!state.currentThemeId) {
          const defaultTheme = action.payload.find(t => t.isDefault);
          if (defaultTheme) {
            state.currentThemeId = defaultTheme.id;
          } else if (action.payload.length > 0) {
            state.currentThemeId = action.payload[0].id;
          }
        }
      })
      .addCase(fetchThemes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch themes';
      });

    // Create custom theme
    builder
      .addCase(createCustomTheme.fulfilled, (state, action) => {
        const newTheme = action.payload;
        state.allThemes[newTheme.id] = newTheme;
        state.customThemes.push(newTheme.id);
        state.isCustomizing = false;
        state.customizationDraft = null;
      });

    // Update theme
    builder
      .addCase(updateTheme.fulfilled, (state, action) => {
        const updatedTheme = action.payload;
        state.allThemes[updatedTheme.id] = updatedTheme;
      });

    // Delete theme
    builder
      .addCase(deleteTheme.fulfilled, (state, action) => {
        const themeId = action.payload;
        delete state.allThemes[themeId];

        // Remove from arrays
        state.predefinedThemes = state.predefinedThemes.filter(id => id !== themeId);
        state.customThemes = state.customThemes.filter(id => id !== themeId);

        // If deleted theme was current, switch to default
        if (state.currentThemeId === themeId) {
          const defaultTheme = Object.values(state.allThemes).find(t => t.isDefault);
          state.currentThemeId = defaultTheme?.id || null;
        }
      });
  },
});

export const {
  setCurrentTheme,
  startCustomization,
  updateCustomizationColor,
  cancelCustomization,
  clearError,
} = themeSlice.actions;

export default themeSlice.reducer;