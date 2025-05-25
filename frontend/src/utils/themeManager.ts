/**
 * Theme management utilities
 */

import { Theme, ThemeColors } from '@/types/themeTypes';

/**
 * Flatten nested theme colors object for CSS variable application
 */
export function flattenThemeColors(colors: ThemeColors, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(colors)) {
    const cssKey = prefix ? `${prefix}-${key}` : key;
    
    if (typeof value === 'string') {
      result[cssKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenThemeColors(value as any, cssKey));
    }
  }
  
  return result;
}

/**
 * Get nested value from object using dot notation path
 */
export function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation path
 */
export function setNestedValue(obj: any, path: string, value: string): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Deep merge two objects
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Apply theme to the DOM
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme.isDefault) {
    // For default theme, remove data-theme attribute to use CSS :root styles
    root.removeAttribute('data-theme');
    
    // Also clear any CSS variables that might have been set
    const flatColors = flattenThemeColors(theme.colors);
    Object.keys(flatColors).forEach(key => {
      root.style.removeProperty(`--color-${key}`);
    });
  } else {
    // For non-default themes, inject CSS variables
    const flatColors = flattenThemeColors(theme.colors);
    
    Object.entries(flatColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Set data-theme attribute for potential CSS selectors
    root.setAttribute('data-theme', theme.id);
  }
}

/**
 * Apply colors directly (for live preview during customization)
 */
export function applyColors(colors: ThemeColors): void {
  const root = document.documentElement;
  const flatColors = flattenThemeColors(colors);
  
  Object.entries(flatColors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
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

/**
 * Read current theme colors from CSS
 */
export function readCurrentThemeColors(): Record<string, string> {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const colors: Record<string, string> = {};
  
  // List of CSS variables to read
  const cssVariables = [
    '--color-sidebar-background',
    '--color-sidebar-text',
    '--color-explorer-background',
    '--color-explorer-item-background-hover',
    '--color-explorer-item-text-default',
    '--color-explorer-item-text-hover',
    '--color-main-tabs-background',
    '--color-main-tab-background-default',
    '--color-main-tab-text-default',
    '--color-main-tab-active-backgroun',
    '--color-main-tab-active-text',
    '--color-main-tab-background-hover',
    '--color-main-tab-text-hover',
    '--color-main-content-background',
    '--color-main-content-text',
  ];
  
  cssVariables.forEach(cssVar => {
    const value = computedStyle.getPropertyValue(cssVar).trim();
    if (value) {
      const key = cssVar.replace('--color-', '').replace(/-/g, '.');
      colors[key] = value;
    }
  });
  
  return colors;
}