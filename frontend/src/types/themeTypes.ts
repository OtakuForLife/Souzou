/**
 * Theme-related TypeScript types
 */

export interface ThemeColors {

  sidebar: {
    background: string;
    text: string;
  };
  explorer: {
    background: string;
    item: {
      background: {
        hover: string;
      };
      text: {
        default: string;
        hover: string;
      };
    };
  };
  main: {
    tabs:{
      background: string;
    };
    tab:{
      text: {
        default: string;
        hover: string;
      };
      background: {
        default: string;
        hover: string;
      };
      active: {
        text: string;
        background: string;
      };
    };
    content: {
      background: string;
      text: string;
    };
  };
  editor: {
    background: string;
    text: string;
    selection: string;
    cursor: string;
    lineNumber: string;
    syntax: {
      keyword: string;
      string: string;
      comment: string;
      function: string;
      variable: string;
    };
  };
}

export interface Theme {
  id: string;
  name: string;
  type: 'predefined' | 'custom';
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
