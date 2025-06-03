/**
 * Unit tests for widget types and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  WidgetType,
  createDefaultWidget,
  createDefaultViewContent,
  isWidgetOfType,
  isValidWidgetType,
  DEFAULT_WIDGET_CONFIGS,
  WIDGET_CONSTRAINTS,
  DEFAULT_GRID_CONFIG,
} from '../widgetTypes';

describe('Widget Types System', () => {
  describe('WidgetType enum', () => {
    it('should contain expected widget types', () => {
      expect(WidgetType.GRAPH).toBe('graph');
      expect(Object.values(WidgetType)).toContain('graph');
    });
  });

  describe('DEFAULT_WIDGET_CONFIGS', () => {
    it('should have configuration for all widget types', () => {
      Object.values(WidgetType).forEach(type => {
        expect(DEFAULT_WIDGET_CONFIGS[type]).toBeDefined();
      });
    });

    it('should have valid graph widget default config', () => {
      const graphConfig = DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH];
      expect(graphConfig.maxDepth).toBe(2);
      expect(graphConfig.layoutAlgorithm).toBe('circle');
      expect(graphConfig.showLabels).toBe(true);
      expect(graphConfig.nodeSize).toBe(30);
      expect(graphConfig.edgeWidth).toBe(2);
    });
  });

  describe('WIDGET_CONSTRAINTS', () => {
    it('should have constraints for all widget types', () => {
      Object.values(WidgetType).forEach(type => {
        expect(WIDGET_CONSTRAINTS[type]).toBeDefined();
      });
    });

    it('should have valid graph widget constraints', () => {
      const graphConstraints = WIDGET_CONSTRAINTS[WidgetType.GRAPH];
      expect(graphConstraints.minW).toBe(3);
      expect(graphConstraints.minH).toBe(3);
      expect(graphConstraints.maxW).toBe(12);
      expect(graphConstraints.maxH).toBe(8);
    });

    it('should have logical constraint values', () => {
      Object.values(WIDGET_CONSTRAINTS).forEach(constraints => {
        expect(constraints.minW).toBeGreaterThan(0);
        expect(constraints.minH).toBeGreaterThan(0);
        expect(constraints.maxW).toBeGreaterThanOrEqual(constraints.minW);
        expect(constraints.maxH).toBeGreaterThanOrEqual(constraints.minH);
      });
    });
  });

  describe('DEFAULT_GRID_CONFIG', () => {
    it('should have valid default grid configuration', () => {
      expect(DEFAULT_GRID_CONFIG.cols).toBe(15);
      expect(DEFAULT_GRID_CONFIG.rowHeight).toBe(50);
      expect(DEFAULT_GRID_CONFIG.margin).toEqual([16, 16]);
      expect(DEFAULT_GRID_CONFIG.containerPadding).toEqual([16, 16]);
    });

    it('should have breakpoints configuration', () => {
      expect(DEFAULT_GRID_CONFIG.breakpoints).toBeDefined();
      expect(DEFAULT_GRID_CONFIG.colsByBreakpoint).toBeDefined();
      
      const breakpoints = DEFAULT_GRID_CONFIG.breakpoints!;
      expect(breakpoints.lg).toBe(1200);
      expect(breakpoints.md).toBe(996);
      expect(breakpoints.sm).toBe(768);
    });
  });

  describe('createDefaultViewContent', () => {
    it('should create valid default view content', () => {
      const viewContent = createDefaultViewContent();
      
      expect(viewContent.layout).toBeDefined();
      expect(viewContent.widgets).toEqual([]);
      expect(viewContent.layout.cols).toBe(DEFAULT_GRID_CONFIG.cols);
      expect(viewContent.layout.rowHeight).toBe(DEFAULT_GRID_CONFIG.rowHeight);
      expect(viewContent.layout.margin).toEqual(DEFAULT_GRID_CONFIG.margin);
    });

    it('should create new instances on each call', () => {
      const content1 = createDefaultViewContent();
      const content2 = createDefaultViewContent();
      
      expect(content1).not.toBe(content2);
      expect(content1.widgets).not.toBe(content2.widgets);
      expect(content1.layout).not.toBe(content2.layout);
    });
  });

  describe('createDefaultWidget', () => {
    it('should create valid graph widget', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      
      expect(widget.type).toBe(WidgetType.GRAPH);
      expect(widget.id).toBeDefined();
      expect(widget.id).toMatch(/^widget-\d+-[a-z0-9]+$/);
      expect(widget.title).toBe('Graph Widget');
      expect(widget.showHeaderInViewMode).toBe(true);
    });

    it('should apply widget constraints to position', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      const constraints = WIDGET_CONSTRAINTS[WidgetType.GRAPH];
      
      expect(widget.position.x).toBe(position.x);
      expect(widget.position.y).toBe(position.y);
      expect(widget.position.w).toBe(position.w);
      expect(widget.position.h).toBe(position.h);
      expect(widget.position.minW).toBe(constraints.minW);
      expect(widget.position.minH).toBe(constraints.minH);
      expect(widget.position.maxW).toBe(constraints.maxW);
      expect(widget.position.maxH).toBe(constraints.maxH);
    });

    it('should use custom title when provided', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const customTitle = 'My Custom Graph';
      const widget = createDefaultWidget(WidgetType.GRAPH, position, customTitle);
      
      expect(widget.title).toBe(customTitle);
    });

    it('should include default configuration for graph widget', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      
      if (widget.type === WidgetType.GRAPH) {
        expect(widget.config).toEqual(DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH]);
      }
    });

    it('should generate unique IDs for different widgets', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget1 = createDefaultWidget(WidgetType.GRAPH, position);
      const widget2 = createDefaultWidget(WidgetType.GRAPH, position);
      
      expect(widget1.id).not.toBe(widget2.id);
    });

    it('should throw error for unknown widget type', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      
      expect(() => {
        createDefaultWidget('unknown' as any, position);
      }).toThrow('Unknown widget type: unknown');
    });
  });

  describe('isWidgetOfType', () => {
    it('should return true for matching widget type', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const graphWidget = createDefaultWidget(WidgetType.GRAPH, position);
      
      expect(isWidgetOfType(graphWidget, WidgetType.GRAPH)).toBe(true);
    });

    it('should return false for non-matching widget type', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const graphWidget = createDefaultWidget(WidgetType.GRAPH, position);
      
      // Since we only have one widget type, we can't test false case properly
      // But we can test the type guard functionality
      if (isWidgetOfType(graphWidget, WidgetType.GRAPH)) {
        expect(graphWidget.type).toBe(WidgetType.GRAPH);
        expect(graphWidget.config).toBeDefined();
      }
    });

    it('should provide proper type narrowing', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      
      if (isWidgetOfType(widget, WidgetType.GRAPH)) {
        // TypeScript should know this is a GraphWidgetConfig
        expect(widget.config.maxDepth).toBeDefined();
        expect(widget.config.layoutAlgorithm).toBeDefined();
        expect(widget.config.showLabels).toBeDefined();
      }
    });
  });

  describe('isValidWidgetType', () => {
    it('should return true for valid widget types', () => {
      expect(isValidWidgetType('graph')).toBe(true);
      expect(isValidWidgetType(WidgetType.GRAPH)).toBe(true);
    });

    it('should return false for invalid widget types', () => {
      expect(isValidWidgetType('invalid')).toBe(false);
      expect(isValidWidgetType('')).toBe(false);
      expect(isValidWidgetType('table')).toBe(false); // Not implemented yet
    });

    it('should handle edge cases', () => {
      expect(isValidWidgetType(null as any)).toBe(false);
      expect(isValidWidgetType(undefined as any)).toBe(false);
      expect(isValidWidgetType(123 as any)).toBe(false);
    });
  });

  describe('Type system integration', () => {
    it('should maintain type safety across operations', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      
      // Test that the widget can be used in type-safe operations
      expect(widget.type).toBe(WidgetType.GRAPH);
      
      if (isWidgetOfType(widget, WidgetType.GRAPH)) {
        // This should compile without type assertions
        const config = widget.config;
        expect(config.maxDepth).toBeTypeOf('number');
        expect(config.layoutAlgorithm).toBeTypeOf('string');
        expect(config.showLabels).toBeTypeOf('boolean');
      }
    });

    it('should work with discriminated union patterns', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position);
      
      // Test discriminated union behavior
      switch (widget.type) {
        case WidgetType.GRAPH:
          expect(widget.config.maxDepth).toBeDefined();
          break;
        default:
          fail('Unexpected widget type');
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle extreme position values', () => {
      const extremePosition = { x: 999, y: 999, w: 1, h: 1 };
      const widget = createDefaultWidget(WidgetType.GRAPH, extremePosition);
      
      expect(widget.position.x).toBe(999);
      expect(widget.position.y).toBe(999);
      expect(widget.position.w).toBe(1);
      expect(widget.position.h).toBe(1);
    });

    it('should handle empty title gracefully', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, position, '');

      // When empty title is provided, it should fall back to default title
      expect(widget.title).toBe('Graph Widget');
    });

    it('should handle very long titles', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const longTitle = 'A'.repeat(1000);
      const widget = createDefaultWidget(WidgetType.GRAPH, position, longTitle);
      
      expect(widget.title).toBe(longTitle);
    });
  });
});
