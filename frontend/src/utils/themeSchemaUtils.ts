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
 * Type guard to check if a value is a color field definition
 */
interface ColorFieldDefinition {
  type: 'color';
  label: string;
  default: string;
}

function isColorFieldDefinition(value: unknown): value is ColorFieldDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'color' &&
    'label' in value &&
    'default' in value
  );
}

/**
 * Flatten schema into array of color fields for easy iteration and UI generation
 */
export function flattenSchema(
  schema: Record<string, unknown>,
  parentPath: SchemaPath = [],
  parentLabel: string[] = []
): ColorField[] {
  const fields: ColorField[] = [];

  for (const [key, value] of Object.entries(schema)) {
    const currentPath = [...parentPath, key];

    if (isColorFieldDefinition(value)) {
      const currentLabel = [...parentLabel, value.label || key];
      fields.push({
        path: currentPath,
        label: value.label || key,
        fullLabel: currentLabel.join(' > '),
        default: value.default
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested object
      fields.push(...flattenSchema(value as Record<string, unknown>, currentPath, parentLabel));
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
export function createDefaultThemeColors(schema: Record<string, unknown> = THEME_COLORS_SCHEMA): ThemeColors {
  const result: any = {};

  for (const [key, value] of Object.entries(schema)) {
    if (isColorFieldDefinition(value)) {
      result[key] = value.default;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = createDefaultThemeColors(value as Record<string, unknown>);
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

