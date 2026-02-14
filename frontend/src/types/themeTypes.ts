/**
 * Theme-related TypeScript types
 */

// Schema definition - single source of truth for theme colors (FLAT structure)
export const THEME_COLORS_SCHEMA = {
  '--color-surface-0': { type: 'color' as const, label: 'Primary', section: 'Surface', default: '#ffffff' },
  '--color-surface-0-hover': { type: 'color' as const, label: 'Primary Hover', section: 'Surface', default: '#1f2937' },
  '--color-surface-1': { type: 'color' as const, label: 'Secondary', section: 'Surface', default: '#f8fafc' },
  '--color-surface-1-hover': { type: 'color' as const, label: 'Secondary Hover', section: 'Surface', default: '#f1f5f9' },
  '--color-surface-2': { type: 'color' as const, label: 'Tertiary', section: 'Surface', default: '#f8fafc' },
  '--color-surface-2-hover': { type: 'color' as const, label: 'Tertiary Hover', section: 'Surface', default: '#f1f5f9' },

  '--color-text-primary': { type: 'color' as const, label: 'Primary', section: 'Text', default: '#1f2937' },
  '--color-text-primary-hover': { type: 'color' as const, label: 'Primary Hover', section: 'Text', default: '#1f2937' },
  '--color-text-secondary': { type: 'color' as const, label: 'Secondary', section: 'Text', default: '#6b7280' },
  '--color-text-secondary-hover': { type: 'color' as const, label: 'Secondary Hover', section: 'Text', default: '#374151' },
  '--color-text-tertiary': { type: 'color' as const, label: 'Tertiary', section: 'Text', default: '#9ca3af' },
  '--color-text-tertiary-hover': { type: 'color' as const, label: 'Tertiary Hover', section: 'Text', default: '#374151' },

  '--color-tab-active': { type: 'color' as const, label: 'Active', section: 'Tabs', default: '#1f2937' },
  '--color-tab-active-hover': { type: 'color' as const, label: 'Active Hover', section: 'Tabs', default: '#1f2937' },
  '--color-tab-inactive': { type: 'color' as const, label: 'Inactive', section: 'Tabs', default: '#f8fafc' },
  '--color-tab-inactive-hover': { type: 'color' as const, label: 'Inactive Hover', section: 'Tabs', default: '#f1f5f9' },

  '--color-border-primary': { type: 'color' as const, label: 'Primary', section: 'Border', default: '#e5e7eb' },

  '--color-button-primary': { type: 'color' as const, label: 'Primary', section: 'Buttons', default: '#3b82f6' },
  '--color-button-primary-hover': { type: 'color' as const, label: 'Primary Hover', section: 'Buttons', default: '#2563eb' },
  '--color-button-primary-clicked': { type: 'color' as const, label: 'Primary Clicked', section: 'Buttons', default: '#1d4ed8' },

  '--color-button-alert': { type: 'color' as const, label: 'Alert', section: 'Buttons', default: '#ef4444' },
  '--color-button-alert-hover': { type: 'color' as const, label: 'Alert Hover', section: 'Buttons', default: '#dc2626' },
  '--color-button-alert-clicked': { type: 'color' as const, label: 'Alert Clicked', section: 'Buttons', default: '#b91c1c' },
} as const;

// Derive ThemeColors type from flat schema
export type ThemeColors = {
  [K in keyof typeof THEME_COLORS_SCHEMA]: string;
};

export interface Theme {
  id: string;
  name: string;
  custom: boolean;
  isDefault: boolean;
  colors: ThemeColors;
  createdAt: string;
  updatedAt: string;
}

// Preset colors for color picker
export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937',
  '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#9ca3af', '#374151'
];
