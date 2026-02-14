/**
 * Theme management utilities for FLAT theme structure
 */

import { Theme, ThemeColors } from '@/types/themeTypes';

/**
 * Apply theme to the DOM
 */
export function applyTheme(theme: Theme): void {
  if (theme.isDefault) {
    // For default theme, remove data-theme attribute to use CSS :root styles
    removeColors(theme.colors);
  } else {
    // For non-default themes, inject CSS variables directly (colors are already flat)
    applyColors(theme.colors, theme.id);
  }
}

/**
 * Apply colors directly (for live preview during customization)
 */
export function applyColors(colors: ThemeColors, themeId: string): void {
  const root = document.documentElement;

  // Colors are already flat, apply directly
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  // Set data-theme attribute for potential CSS selectors
  root.setAttribute('data-theme', themeId);
}


export function removeColors(colors: ThemeColors): void {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  // Also clear any CSS variables that might have been set
  Object.keys(colors).forEach(key => {
    root.style.removeProperty(key);
  });
}

/**
 * Get current CSS variable value
 */
export function getCSSVariableValue(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}