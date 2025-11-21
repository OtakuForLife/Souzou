/**
 * Utilities for working with the theme color schema
 */

import { THEME_COLORS_SCHEMA, ThemeColors } from '@/types/themeTypes';

export type SchemaPath = string[];

export interface ColorField {
  path: SchemaPath;
  label: string;
  fullLabel: string; // e.g., "Sidebar > Background"
  default: string;
}

/**
 * Flatten schema into array of color fields for easy iteration
 */
export function flattenSchema(
  schema: any,
  parentPath: SchemaPath = [],
  parentLabel: string[] = []
): ColorField[] {
  const fields: ColorField[] = [];

  for (const [key, value] of Object.entries(schema)) {
    const currentPath = [...parentPath, key];
    
    if (value && typeof value === 'object' && 'type' in value && value.type === 'color') {
      const currentLabel = [...parentLabel, value.label || key];
      fields.push({
        path: currentPath,
        label: value.label || key,
        fullLabel: currentLabel.join(' > '),
        default: value.default
      });
    } else if (value && typeof value === 'object') {
      // Recurse into nested object
      fields.push(...flattenSchema(value, currentPath, parentLabel));
    }
  }

  return fields;
}

/**
 * Get nested value from object using path array
 */
export function getByPath(obj: any, path: SchemaPath): any {
  return path.reduce((acc, key) => acc?.[key], obj);
}

/**
 * Set nested value in object using path array (immutable)
 */
export function setByPath(obj: any, path: SchemaPath, value: any): any {
  if (path.length === 0) return value;
  
  const [head, ...tail] = path;
  return {
    ...obj,
    [head]: setByPath(obj[head] || {}, tail, value)
  };
}

/**
 * Create default theme colors from schema
 */
export function createDefaultThemeColors(schema: typeof THEME_COLORS_SCHEMA = THEME_COLORS_SCHEMA): ThemeColors {
  const result: any = {};
  
  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === 'object' && 'type' in value && value.type === 'color') {
      result[key] = value.default;
    } else if (value && typeof value === 'object') {
      result[key] = createDefaultThemeColors(value as any);
    }
  }
  
  return result as ThemeColors;
}

/**
 * Group fields by top-level section (sidebar, explorer, main, editor)
 */
export function groupFieldsBySection(fields: ColorField[]): Record<string, ColorField[]> {
  const groups: Record<string, ColorField[]> = {};
  
  for (const field of fields) {
    const section = field.path[0];
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
  }
  
  return groups;
}

/**
 * Get section name from path (first element, capitalized)
 */
export function getSectionName(path: SchemaPath): string {
  if (path.length === 0) return '';
  return path[0].charAt(0).toUpperCase() + path[0].slice(1);
}

/**
 * Get subsection path (everything except first element)
 * e.g., ['editor', 'syntax', 'keyword'] -> ['syntax', 'keyword']
 */
export function getSubsectionPath(path: SchemaPath): SchemaPath {
  return path.slice(1);
}

/**
 * Format path as readable label
 * e.g., ['editor', 'syntax', 'keyword'] -> 'Syntax > Keyword'
 */
export function formatPathLabel(path: SchemaPath, skipFirst: boolean = false): string {
  const pathToFormat = skipFirst ? path.slice(1) : path;
  return pathToFormat
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' > ');
}

