/**
 * Widget type definitions for the dashboard system
 */

export enum WidgetType {
  GRAPH = 'graph',
}

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

export interface BaseWidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: GridPosition;
  showHeaderInViewMode?: boolean; // New setting for header visibility in view mode
}

export interface GraphWidgetConfig extends BaseWidgetConfig {
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

// Union type for all widget configurations
export type WidgetConfig = GraphWidgetConfig;

// Default configurations for new widgets
export const DEFAULT_WIDGET_CONFIGS = {
  [WidgetType.GRAPH]: {
    maxDepth: 2,
    layoutAlgorithm: 'circle' as const,
    showLabels: true,
    nodeSize: 30,
    edgeWidth: 2,
  },
} as const;

// Widget size constraints
export const WIDGET_CONSTRAINTS = {
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

export interface ViewContent {
  layout: {
    cols: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding?: [number, number];
    breakpoints?: Record<string, number>;
    colsByBreakpoint?: Record<string, number>;
  };
  widgets: WidgetConfig[];
}

// Helper function to create default view content
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

// Helper function to create a new widget with default configuration
export function createDefaultWidget(
  type: WidgetType,
  position: Omit<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>,
  title?: string
): WidgetConfig {
  const constraints = WIDGET_CONSTRAINTS[type];
  const baseConfig: BaseWidgetConfig = {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
    position: {
      ...position,
      ...constraints,
    },
    showHeaderInViewMode: true, // Default to showing header in view mode
  };

  switch (type) {
    case WidgetType.GRAPH:
      return {
        ...baseConfig,
        type: WidgetType.GRAPH,
        config: DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH],
      } as GraphWidgetConfig;

    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}
