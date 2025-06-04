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
  NOTE = 'note',
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
  position: GridPosition;
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
 * Note widget specific configuration
 */
export interface NoteWidgetConfig extends BaseWidgetConfig<WidgetType.NOTE> {
  type: WidgetType.NOTE;
  config: {
    noteId?: string;
    isEditable: boolean;
  };
}

/**
 * Type-safe mapping of widget types to their configurations
 * This enables proper type inference and eliminates the need for type assertions
 */
export interface WidgetConfigMap {
  [WidgetType.GRAPH]: GraphWidgetConfig;
  [WidgetType.NOTE]: NoteWidgetConfig;
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
  [WidgetType.NOTE]: {
    isEditable: false,
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
  [WidgetType.NOTE]: {
    minW: 3,
    minH: 4,
    maxW: 12,
    maxH: 12,
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
 * Generate a unique widget ID
 * @returns Unique widget identifier
 */
export function generateWidgetId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Creates a new widget with default configuration
 * @template T - The widget type
 * @param type - The widget type to create
 * @param options - Configuration options
 * @param options.position - Grid position (without constraints). If not provided, uses default position
 * @returns Type-safe widget configuration
 */
export function createDefaultWidget<T extends WidgetType>(
  type: T,
  options: {
    position?: Omit<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>;
  } = {}
): WidgetConfigForType<T> {
  const {
    position = { x: 0, y: 0, w: 4, h: 3 },
  } = options;

  const constraints = WIDGET_CONSTRAINTS[type];

  const baseConfig: BaseWidgetConfig<T> = {
    id: generateWidgetId(),
    type,
    position: {
      ...position,
      ...constraints,
    },
  };
  return {
    ...baseConfig,
    type: type,
    config: DEFAULT_WIDGET_CONFIGS[type],
  } as WidgetConfigForType<T>;
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

/**
 * Widget component props interface
 */
export interface WidgetProps<T extends WidgetType> {
  widget: WidgetConfigForType<T>;
  mode?: 'render' | 'config';
  onUpdate?: (updates: Partial<WidgetConfigForType<T>>) => void;
  onDelete?: () => void;
}

/**
 * Widget configuration component props interface
 */
export interface WidgetConfigProps<T extends WidgetType> {
  widget: WidgetConfigForType<T>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfigForType<T>['config']) => void;
}
