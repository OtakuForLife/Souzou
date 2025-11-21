/**
 * Theme-related TypeScript types
 */

// Schema definition - single source of truth for theme colors
export const THEME_COLORS_SCHEMA = {
  sidebar: {
    background: { type: 'color' as const, label: 'Background', default: '#ffffff' },
    text: { type: 'color' as const, label: 'Text', default: '#1f2937' }
  },
  explorer: {
    background: { type: 'color' as const, label: 'Background', default: '#f8fafc' },
    item: {
      background: {
        hover: { type: 'color' as const, label: 'Hover', default: '#f1f5f9' }
      },
      text: {
        default: { type: 'color' as const, label: 'Default', default: '#1f2937' },
        hover: { type: 'color' as const, label: 'Hover', default: '#1f2937' }
      }
    }
  },
  main: {
    tabs: {
      background: { type: 'color' as const, label: 'Background', default: '#f8fafc' }
    },
    tab: {
      text: {
        default: { type: 'color' as const, label: 'Default', default: '#6b7280' },
        hover: { type: 'color' as const, label: 'Hover', default: '#1f2937' }
      },
      background: {
        default: { type: 'color' as const, label: 'Default', default: '#ffffff' },
        hover: { type: 'color' as const, label: 'Hover', default: '#f1f5f9' }
      },
      active: {
        text: { type: 'color' as const, label: 'Text', default: '#1f2937' },
        background: { type: 'color' as const, label: 'Background', default: '#ffffff' }
      }
    },
    content: {
      background: { type: 'color' as const, label: 'Background', default: '#ffffff' },
      text: { type: 'color' as const, label: 'Text', default: '#1f2937' }
    }
  },
  editor: {
    background: { type: 'color' as const, label: 'Background', default: '#ffffff' },
    text: { type: 'color' as const, label: 'Text', default: '#1f2937' },
    selection: { type: 'color' as const, label: 'Selection', default: '#3b82f620' },
    cursor: { type: 'color' as const, label: 'Cursor', default: '#3b82f6' },
    lineNumber: { type: 'color' as const, label: 'Line Number', default: '#9ca3af' },
    syntax: {
      keyword: { type: 'color' as const, label: 'Keyword', default: '#7c3aed' },
      string: { type: 'color' as const, label: 'String', default: '#059669' },
      comment: { type: 'color' as const, label: 'Comment', default: '#6b7280' },
      function: { type: 'color' as const, label: 'Function', default: '#dc2626' },
      variable: { type: 'color' as const, label: 'Variable', default: '#1f2937' }
    }
  }
} as const;

// Type inference helpers
type SchemaLeaf = { type: 'color'; label: string; default: string };

type InferThemeColors<T> = T extends SchemaLeaf
  ? string
  : { [K in keyof T]: InferThemeColors<T[K]> };

// Derive ThemeColors type from schema
export type ThemeColors = InferThemeColors<typeof THEME_COLORS_SCHEMA>;



export interface Theme {
  id: string;
  name: string;
  custom: boolean;
  isDefault: boolean;
  colors: ThemeColors;
  createdAt: string;
  updatedAt: string;
}

export interface ColorPickerItem {
  label: string;
  path: string; // e.g., 'primary', 'text.primary', 'editor.syntax.keyword'
  description?: string;
  category: string;
}

// Color picker categories and items
export const COLOR_PICKER_ITEMS: ColorPickerItem[] = [
  // Base Colors
  { label: 'Primary Color', path: 'primary', category: 'Base Colors', description: 'Main brand color' },
  { label: 'Primary Hover', path: 'primaryHover', category: 'Base Colors', description: 'Primary color on hover' },
  { label: 'Secondary Color', path: 'secondary', category: 'Base Colors' },
  { label: 'Background', path: 'background', category: 'Base Colors' },
  { label: 'Surface', path: 'surface', category: 'Base Colors', description: 'Cards, panels' },
  { label: 'Surface Hover', path: 'surfaceHover', category: 'Base Colors' },
  
  // Text Colors
  { label: 'Primary Text', path: 'text.primary', category: 'Text Colors' },
  { label: 'Secondary Text', path: 'text.secondary', category: 'Text Colors' },
  { label: 'Muted Text', path: 'text.muted', category: 'Text Colors' },
  { label: 'Text on Primary', path: 'text.onPrimary', category: 'Text Colors' },
  
  // Border Colors
  { label: 'Default Border', path: 'border.default', category: 'Borders' },
  { label: 'Hover Border', path: 'border.hover', category: 'Borders' },
  
  // Editor Colors
  { label: 'Editor Background', path: 'editor.background', category: 'Editor' },
  { label: 'Editor Text', path: 'editor.text', category: 'Editor' },
  { label: 'Selection', path: 'editor.selection', category: 'Editor' },
  { label: 'Cursor', path: 'editor.cursor', category: 'Editor' },
  { label: 'Line Numbers', path: 'editor.lineNumber', category: 'Editor' },
  
  // Syntax Highlighting
  { label: 'Keywords', path: 'editor.syntax.keyword', category: 'Syntax Highlighting', description: 'if, for, class, etc.' },
  { label: 'Strings', path: 'editor.syntax.string', category: 'Syntax Highlighting', description: '"text", \'text\'' },
  { label: 'Comments', path: 'editor.syntax.comment', category: 'Syntax Highlighting', description: '// comments' },
  { label: 'Functions', path: 'editor.syntax.function', category: 'Syntax Highlighting', description: 'function names' },
  { label: 'Variables', path: 'editor.syntax.variable', category: 'Syntax Highlighting', description: 'variable names' },
];

// Preset colors for color picker
export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937',
  '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#9ca3af', '#374151'
];
