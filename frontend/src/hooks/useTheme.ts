/**
 * Custom hook for theme management
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  fetchThemes,
  setCurrentTheme,
  startCustomization,
  updateCustomizationColor,
  cancelCustomization,
  createCustomTheme,
  deleteTheme,
} from '@/store/slices/themeSlice';
import {
  selectCurrentTheme,
  selectPredefinedThemes,
  selectCustomThemes,
  selectAllThemesArray,
  selectThemeLoading,
  selectThemeError,
  selectIsCustomizing,
  selectCustomizationDraft,
  selectEffectiveColors,
} from '@/store/selectors/themeSelectors';
import { applyTheme, applyColors, getNestedValue } from '@/utils/themeManager';
import { ThemeColors, Theme } from '@/types/themeTypes';
import { useAppDispatch, useAppSelector } from '@/hooks';

export function useTheme() {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);
  const isApplyingTheme = useRef(false);
  const pauseEffects = useRef(false);

  // Selectors
  const currentTheme = useAppSelector(selectCurrentTheme);
  const predefinedThemes = useAppSelector(selectPredefinedThemes);
  const customThemes = useAppSelector(selectCustomThemes);
  const allThemes = useAppSelector(selectAllThemesArray);
  const loading = useAppSelector(selectThemeLoading);
  const error = useAppSelector(selectThemeError);
  const isCustomizing = useAppSelector(selectIsCustomizing);
  const customizationDraft = useAppSelector(selectCustomizationDraft);
  const effectiveColors = useAppSelector(selectEffectiveColors);

  // Load themes on mount (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      dispatch(fetchThemes());
      hasInitialized.current = true;
    }
  }, [dispatch]);

  // Apply theme when current theme changes (with debouncing)
  useEffect(() => {
    if (currentTheme && !isApplyingTheme.current && !pauseEffects.current) {
      isApplyingTheme.current = true;

      // Use requestAnimationFrame to debounce rapid theme changes
      const frameId = requestAnimationFrame(() => {
        if (!pauseEffects.current) {
          applyTheme(currentTheme);
        }
        isApplyingTheme.current = false;
      });

      // Cleanup function
      return () => {
        cancelAnimationFrame(frameId);
        isApplyingTheme.current = false;
      };
    }
  }, [currentTheme]);

  // Apply colors during customization
  useEffect(() => {
    if (isCustomizing && effectiveColors && !isApplyingTheme.current) {
      isApplyingTheme.current = true;

      const frameId = requestAnimationFrame(() => {
        applyColors(effectiveColors);
        isApplyingTheme.current = false;
      });

      // Cleanup function
      return () => {
        cancelAnimationFrame(frameId);
        isApplyingTheme.current = false;
      };
    }
  }, [isCustomizing, effectiveColors]);

  // Load saved theme from localStorage on mount (only once when themes are loaded)
  useEffect(() => {
    if (allThemes.length > 0 && !currentTheme) {
      const savedThemeId = localStorage.getItem('currentThemeId');
      if (savedThemeId) {
        const savedTheme = allThemes.find((t: Theme) => t.id === savedThemeId);
        if (savedTheme) {
          dispatch(setCurrentTheme(savedThemeId));
          return;
        }
      }

      // No saved theme or saved theme not found, use default
      const defaultTheme = allThemes.find((t: Theme) => t.isDefault);
      if (defaultTheme) {
        dispatch(setCurrentTheme(defaultTheme.id));
      }
    }
  }, [allThemes, currentTheme, dispatch]);

  // Actions
  const switchTheme = useCallback((themeId: string) => {
    // Prevent switching to the same theme
    if (currentTheme?.id === themeId) {
      return;
    }
    dispatch(setCurrentTheme(themeId));
  }, [dispatch, currentTheme]);

  const startThemeCustomization = useCallback((baseThemeId: string) => {
    dispatch(startCustomization(baseThemeId));
  }, [dispatch]);

  const updateColor = useCallback((path: string, color: string) => {
    dispatch(updateCustomizationColor({ path, color }));
  }, [dispatch]);

  const cancelThemeCustomization = useCallback(() => {
    dispatch(cancelCustomization());
    // Reapply current theme to reset any preview changes
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [dispatch, currentTheme]);

  const saveCustomTheme = useCallback(async (name: string) => {
    if (!customizationDraft) return null;

    try {
      const result = await dispatch(createCustomTheme({
        name,
        colors: customizationDraft as ThemeColors,
      }));

      if (createCustomTheme.fulfilled.match(result)) {
        // Switch to the new theme
        dispatch(setCurrentTheme(result.payload.id));
        return result.payload;
      }
      return null;
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      return null;
    }
  }, [dispatch, customizationDraft]);

  const removeTheme = useCallback(async (themeId: string) => {
    try {
      await dispatch(deleteTheme(themeId));
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  }, [dispatch]);

  const getCurrentColor = useCallback((path: string): string => {
    if (isCustomizing && customizationDraft) {
      const draftColor = getNestedValue(customizationDraft, path);
      if (draftColor) return draftColor;
    }

    if (currentTheme) {
      const themeColor = getNestedValue(currentTheme.colors, path);
      if (themeColor) return themeColor;
    }

    return '#000000'; // Fallback color
  }, [currentTheme, isCustomizing, customizationDraft]);

  const refreshThemes = useCallback(() => {
    dispatch(fetchThemes());
  }, [dispatch]);

  const pauseThemeEffects = useCallback((pause: boolean) => {
    pauseEffects.current = pause;
  }, []);

  return {
    // State
    currentTheme,
    predefinedThemes,
    customThemes,
    allThemes,
    loading,
    error,
    isCustomizing,
    customizationDraft,
    effectiveColors,

    // Actions
    switchTheme,
    startThemeCustomization,
    updateColor,
    cancelThemeCustomization,
    saveCustomTheme,
    removeTheme,
    getCurrentColor,
    refreshThemes,
    pauseThemeEffects,
  };
}
