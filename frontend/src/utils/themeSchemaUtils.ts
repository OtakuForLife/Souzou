/**
 * Utilities for working with the FLAT theme color schema
 */

import { THEME_COLORS_SCHEMA, ThemeColors } from '@/types/themeTypes';

export interface ColorField {
  key: string; // e.g., 'nav-sidebar-background'
  label: string; // e.g., 'Nav Sidebar Background'
  section: string; // e.g., 'Nav Sidebar'
  default: string; // e.g., '#ffffff'
}

/**
 * Type guard to check if a value is a color field definition
 */
interface ColorFieldDefinition {
  type: 'color';
  label: string;
  section: string;
  default: string;
}

function isColorFieldDefinition(value: unknown): value is ColorFieldDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'color' &&
    'label' in value &&
    'section' in value &&
    'default' in value
  );
}

/**
 * Convert flat schema into array of color fields for easy iteration and UI generation
 */
export function flattenSchema(
  schema: Record<string, unknown> = THEME_COLORS_SCHEMA
): ColorField[] {
  const fields: ColorField[] = [];

  for (const [key, value] of Object.entries(schema)) {
    if (isColorFieldDefinition(value)) {
      fields.push({
        key,
        label: value.label,
        section: value.section,
        default: value.default
      });
    }
  }

  return fields;
}

/**
 * Get value from flat object using key
 */
export function getByPath(obj: any, path: string[] | string): any {
  // For flat schema, path is just a single key
  const key = Array.isArray(path) ? path[0] : path;
  return obj?.[key];
}

/**
 * Set value in flat object using key (immutable)
 */
export function setByPath(obj: any, path: string[] | string, value: any): any {
  // For flat schema, path is just a single key
  const key = Array.isArray(path) ? path[0] : path;
  return {
    ...obj,
    [key]: value
  };
}

/**
 * Create default theme colors from flat schema
 */
export function createDefaultThemeColors(schema: Record<string, unknown> = THEME_COLORS_SCHEMA): ThemeColors {
  const result: any = {};

  for (const [key, value] of Object.entries(schema)) {
    if (isColorFieldDefinition(value)) {
      result[key] = value.default;
    }
  }

  return result as ThemeColors;
}

/**
 * Group fields by section
 */
export function groupFieldsBySection(fields: ColorField[]): Record<string, ColorField[]> {
  const groups: Record<string, ColorField[]> = {};

  for (const field of fields) {
    const section = field.section;
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
  }

  return groups;
}

/**
 * Get section name (just return the section as-is since it's already formatted)
 */
export function getSectionName(sectionOrPath: string[] | string): string {
  // For backwards compatibility, handle both array and string
  if (Array.isArray(sectionOrPath)) {
    return sectionOrPath[0] || '';
  }
  return sectionOrPath;
}

