/**
 * Widget type definitions for the dashboard system
 *
 * This module provides a type-safe widget system using discriminated unions
 * and proper TypeScript generics to eliminate type assertions and improve
 * compile-time safety.
 */

/**
 * Enumeration of all supported widget types
 */
export enum WidgetType {
  GRAPH = 'graph',
}

/**
 * Grid position configuration for widget layout
 */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

/**
 * Base configuration shared by all widget types
 * @template T - The specific widget type
 */
export interface BaseWidgetConfig<T extends WidgetType = WidgetType> {
  id: string;
  type: T;
  title: string;
  position: GridPosition;
  showHeaderInViewMode?: boolean;
}

/**
 * Graph widget specific configuration
 */
export interface GraphWidgetConfig extends BaseWidgetConfig<WidgetType.GRAPH> {
  type: WidgetType.GRAPH;
  config: {
    rootEntityId?: string;
    maxDepth: number;
    layoutAlgorithm: 'circle' | 'grid' | 'breadthfirst' | 'cose';
    showLabels: boolean;
    nodeSize: number;
    edgeWidth: number;
  };
}

/**
 * Type-safe mapping of widget types to their configurations
 * This enables proper type inference and eliminates the need for type assertions
 */
export interface WidgetConfigMap {
  [WidgetType.GRAPH]: GraphWidgetConfig;
}

/**
 * Discriminated union of all widget configurations
 * This provides compile-time type safety for widget operations
 */
export type WidgetConfig = WidgetConfigMap[keyof WidgetConfigMap];

/**
 * Type helper to extract widget config type from widget type
 * @template T - The widget type
 */
export type WidgetConfigForType<T extends WidgetType> = WidgetConfigMap[T];

/**
 * Default configurations for new widgets
 * Type-safe mapping of widget types to their default configurations
 */
export const DEFAULT_WIDGET_CONFIGS: {
  readonly [K in WidgetType]: WidgetConfigMap[K]['config']
} = {
  [WidgetType.GRAPH]: {
    maxDepth: 2,
    layoutAlgorithm: 'circle' as const,
    showLabels: true,
    nodeSize: 30,
    edgeWidth: 2,
  },
} as const;

/**
 * Widget size constraints for grid layout
 * Type-safe mapping of widget types to their size constraints
 */
export const WIDGET_CONSTRAINTS: {
  readonly [K in WidgetType]: Required<Pick<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>>
} = {
  [WidgetType.GRAPH]: {
    minW: 3,
    minH: 3,
    maxW: 12,
    maxH: 8,
  },
} as const;

// Default grid layout configuration
export const DEFAULT_GRID_CONFIG = {
  cols: 15,
  rowHeight: 50,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  colsByBreakpoint: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
} as const;

/**
 * Grid layout configuration interface
 */
export interface GridLayoutConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding?: [number, number];
  breakpoints?: Record<string, number>;
  colsByBreakpoint?: Record<string, number>;
}

/**
 * Complete view content structure
 * Contains layout configuration and widget instances
 */
export interface ViewContent {
  layout: GridLayoutConfig;
  widgets: WidgetConfig[];
}

/**
 * Creates a default view content with empty widget array
 * @returns Default ViewContent configuration
 */
export function createDefaultViewContent(): ViewContent {
  return {
    layout: {
      cols: DEFAULT_GRID_CONFIG.cols,
      rowHeight: DEFAULT_GRID_CONFIG.rowHeight,
      margin: DEFAULT_GRID_CONFIG.margin,
      containerPadding: DEFAULT_GRID_CONFIG.containerPadding,
      breakpoints: DEFAULT_GRID_CONFIG.breakpoints,
      colsByBreakpoint: DEFAULT_GRID_CONFIG.colsByBreakpoint,
    },
    widgets: [],
  };
}

/**
 * Creates a new widget with default configuration
 * @template T - The widget type
 * @param type - The widget type to create
 * @param position - Grid position (without constraints)
 * @param title - Optional custom title
 * @returns Type-safe widget configuration
 */
export function createDefaultWidget<T extends WidgetType>(
  type: T,
  position: Omit<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>,
  title?: string
): WidgetConfigForType<T> {
  const constraints = WIDGET_CONSTRAINTS[type];
  const baseConfig: BaseWidgetConfig<T> = {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
    position: {
      ...position,
      ...constraints,
    },
    showHeaderInViewMode: true,
  };

  switch (type) {
    case WidgetType.GRAPH:
      return {
        ...baseConfig,
        type: WidgetType.GRAPH,
        config: DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH],
      } as WidgetConfigForType<T>;

    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}

/**
 * Type guard to check if a widget configuration is of a specific type
 * @template T - The widget type to check for
 * @param widget - The widget configuration to check
 * @param type - The expected widget type
 * @returns Type predicate indicating if widget is of type T
 */
export function isWidgetOfType<T extends WidgetType>(
  widget: WidgetConfig,
  type: T
): widget is WidgetConfigForType<T> {
  return widget.type === type;
}

/**
 * Validates that a widget type is supported
 * @param type - The widget type to validate
 * @returns True if the widget type is supported
 */
export function isValidWidgetType(type: string): type is WidgetType {
  return Object.values(WidgetType).includes(type as WidgetType);
}
