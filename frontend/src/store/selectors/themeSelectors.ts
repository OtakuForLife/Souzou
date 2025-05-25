/**
 * Redux selectors for theme state
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Theme } from '@/types/themeTypes';

// Base selectors
export const selectThemeState = (state: RootState) => state.themes;
export const selectAllThemes = (state: RootState) => state.themes.allThemes;
export const selectCurrentThemeId = (state: RootState) => state.themes.currentThemeId;
export const selectThemeLoading = (state: RootState) => state.themes.loading;
export const selectThemeError = (state: RootState) => state.themes.error;
export const selectIsCustomizing = (state: RootState) => state.themes.isCustomizing;
export const selectCustomizationDraft = (state: RootState) => state.themes.customizationDraft;

// Computed selectors
export const selectCurrentTheme = createSelector(
  [selectAllThemes, selectCurrentThemeId],
  (allThemes, currentThemeId) => {
    if (!currentThemeId) return null;
    return allThemes[currentThemeId] || null;
  }
);

export const selectPredefinedThemes = createSelector(
  [selectAllThemes, (state: RootState) => state.themes.predefinedThemes],
  (allThemes, predefinedIds) => {
    return predefinedIds.map((id: string) => allThemes[id]).filter(Boolean);
  }
);

export const selectCustomThemes = createSelector(
  [selectAllThemes, (state: RootState) => state.themes.customThemes],
  (allThemes, customIds) => {
    return customIds.map((id: string) => allThemes[id]).filter(Boolean);
  }
);

export const selectAllThemesArray = createSelector(
  [selectAllThemes],
  (allThemes) => Object.values(allThemes)
);

export const selectDefaultTheme = createSelector(
  [selectAllThemesArray],
  (themes) => themes.find((theme: Theme) => theme.isDefault) || null
);

export const selectThemeById = (themeId: string) => createSelector(
  [selectAllThemes],
  (allThemes) => allThemes[themeId] || null
);

// Effective colors selector (current theme or customization draft)
export const selectEffectiveColors = createSelector(
  [selectCurrentTheme, selectCustomizationDraft, selectIsCustomizing],
  (currentTheme, draft, isCustomizing) => {
    if (isCustomizing && draft && currentTheme) {
      // Merge current theme colors with draft changes
      return { ...currentTheme.colors, ...draft };
    }
    return currentTheme?.colors || null;
  }
);
