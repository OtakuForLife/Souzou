/**
 * Schema validation for widget configurations and view content
 * 
 * This module provides runtime validation using Zod schemas to ensure
 * data integrity when parsing JSON content and validating user input.
 */

import { z } from 'zod';
import { WidgetType } from './widgetTypes';

/**
 * Schema for grid position validation
 */
export const GridPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  minW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
  maxW: z.number().int().min(1).optional(),
  maxH: z.number().int().min(1).optional(),
});

/**
 * Base widget configuration schema
 */
export const BaseWidgetConfigSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(WidgetType),
  title: z.string().min(1),
  position: GridPositionSchema,
  showHeaderInViewMode: z.boolean().optional(),
});

/**
 * Graph widget configuration schema
 */
export const GraphWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  type: z.literal(WidgetType.GRAPH),
  config: z.object({
    rootEntityId: z.string().optional(),
    maxDepth: z.number().int().min(1).max(10),
    layoutAlgorithm: z.enum(['circle', 'grid', 'breadthfirst', 'cose']),
    showLabels: z.boolean(),
    nodeSize: z.number().min(10).max(100),
    edgeWidth: z.number().min(1).max(10),
  }),
});

/**
 * Note widget configuration schema
 */
export const NoteWidgetConfigSchema = BaseWidgetConfigSchema.extend({
  type: z.literal(WidgetType.NOTE),
  config: z.object({
    noteId: z.string().optional(),
    isEditable: z.boolean(),
  }),
});

/**
 * Discriminated union schema for all widget types
 */
export const WidgetConfigSchema = z.discriminatedUnion('type', [
  GraphWidgetConfigSchema,
  NoteWidgetConfigSchema,
]);

/**
 * Grid layout configuration schema
 */
export const GridLayoutConfigSchema = z.object({
  cols: z.number().int().min(1).max(24),
  rowHeight: z.number().min(10),
  margin: z.tuple([z.number().min(0), z.number().min(0)]),
  containerPadding: z.tuple([z.number().min(0), z.number().min(0)]).optional(),
  breakpoints: z.record(z.string(), z.number()).optional(),
  colsByBreakpoint: z.record(z.string(), z.number()).optional(),
});

/**
 * Complete view content schema
 */
export const ViewContentSchema = z.object({
  layout: GridLayoutConfigSchema,
  widgets: z.array(WidgetConfigSchema),
});

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  issues?: z.ZodIssue[];
}

/**
 * Validates widget configuration
 * @param data - Raw widget configuration data
 * @returns Validation result with typed data or error information
 */
export function validateWidgetConfig(data: unknown): ValidationResult<z.infer<typeof WidgetConfigSchema>> {
  try {
    const result = WidgetConfigSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: 'Widget configuration validation failed',
        issues: result.error.issues,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validates view content
 * @param data - Raw view content data
 * @returns Validation result with typed data or error information
 */
export function validateViewContent(data: unknown): ValidationResult<z.infer<typeof ViewContentSchema>> {
  try {
    const result = ViewContentSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: 'View content validation failed',
        issues: result.error.issues,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validates and parses JSON string as view content
 * @param jsonString - JSON string to parse and validate
 * @returns Validation result with parsed and validated data
 */
export function parseAndValidateViewContent(jsonString: string): ValidationResult<z.infer<typeof ViewContentSchema>> {
  try {
    const parsed = JSON.parse(jsonString);
    return validateViewContent(parsed);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `JSON parsing failed: ${error.message}` : 'JSON parsing failed',
    };
  }
}

/**
 * Validates widget configuration for a specific widget type
 * @template T - The widget type
 * @param data - Raw widget configuration data
 * @param expectedType - Expected widget type
 * @returns Validation result with type-specific data
 */
export function validateWidgetConfigForType<T extends WidgetType>(
  data: unknown,
  expectedType: T
): ValidationResult<Extract<z.infer<typeof WidgetConfigSchema>, { type: T }>> {
  const result = validateWidgetConfig(data);
  
  if (!result.success) {
    return result as ValidationResult<Extract<z.infer<typeof WidgetConfigSchema>, { type: T }>>;
  }
  
  if (result.data!.type !== expectedType) {
    return {
      success: false,
      error: `Expected widget type '${expectedType}' but got '${result.data!.type}'`,
    };
  }
  
  return {
    success: true,
    data: result.data as Extract<z.infer<typeof WidgetConfigSchema>, { type: T }>,
  };
}

/**
 * Creates a detailed error message from validation issues
 * @param issues - Zod validation issues
 * @returns Formatted error message
 */
export function formatValidationError(issues: z.ZodIssue[]): string {
  return issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}
