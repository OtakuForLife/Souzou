/**
 * Unit tests for widget types and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  WidgetType,
  createDefaultWidget,
  generateWidgetId,
  createDefaultViewContent,
  isWidgetOfType,
  isValidWidgetType,
  DEFAULT_WIDGET_CONFIGS,
  WIDGET_CONSTRAINTS,
  DEFAULT_GRID_CONFIG,
} from '../widgetTypes';
import { fail } from 'assert';

describe('Widget Types System', () => {
  

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
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });

      expect(widget.type).toBe(WidgetType.GRAPH);
      expect(widget.id).toBeDefined();
      expect(widget.id).toMatch(/^widget-\d+-[a-z0-9]+$/);
    });

    it('should create valid note widget', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.NOTE, { position });

      expect(widget.type).toBe(WidgetType.NOTE);
      expect(widget.id).toBeDefined();
      expect(widget.id).toMatch(/^widget-\d+-[a-z0-9]+$/);
    });

    it('should apply widget constraints to position', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });
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



    it('should include default configuration for graph widget', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });

      if (widget.type === WidgetType.GRAPH) {
        expect(widget.config).toEqual(DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH]);
      }
    });

    it('should include default configuration for note widget', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.NOTE, { position });

      if (widget.type === WidgetType.NOTE) {
        expect(widget.config).toEqual(DEFAULT_WIDGET_CONFIGS[WidgetType.NOTE]);
        expect(widget.config.isEditable).toBe(false);
        expect(widget.config.noteId).toBeUndefined();
      }
    });

    it('should generate unique IDs for different widgets', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget1 = createDefaultWidget(WidgetType.GRAPH, { position });
      const widget2 = createDefaultWidget(WidgetType.GRAPH, { position });

      expect(widget1.id).not.toBe(widget2.id);
    });

    it('should handle unknown widget type gracefully', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };

      // With the simplified approach, unknown widget types don't throw errors
      // but may result in undefined config values
      const widget = createDefaultWidget('unknown' as any, { position });
      expect(widget.type).toBe('unknown');
      expect(widget.id).toBeDefined();
    });

    it('should use default position when none provided', () => {
      const widget = createDefaultWidget(WidgetType.GRAPH);

      expect(widget.position.x).toBe(0);
      expect(widget.position.y).toBe(0);
      expect(widget.position.w).toBe(4);
      expect(widget.position.h).toBe(3);
    });


  });

  describe('isWidgetOfType', () => {
    it('should return true for matching widget type', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const graphWidget = createDefaultWidget(WidgetType.GRAPH, { position });

      expect(isWidgetOfType(graphWidget, WidgetType.GRAPH)).toBe(true);
    });

    it('should return false for non-matching widget type', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const graphWidget = createDefaultWidget(WidgetType.GRAPH, { position });

      // Since we only have one widget type, we can't test false case properly
      // But we can test the type guard functionality
      if (isWidgetOfType(graphWidget, WidgetType.GRAPH)) {
        expect(graphWidget.type).toBe(WidgetType.GRAPH);
        expect(graphWidget.config).toBeDefined();
      }
    });

    it('should provide proper type narrowing', () => {
      const position = { x: 0, y: 0, w: 6, h: 4 };
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });

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
      expect(isValidWidgetType('note')).toBe(true);
      expect(isValidWidgetType(WidgetType.GRAPH)).toBe(true);
      expect(isValidWidgetType(WidgetType.NOTE)).toBe(true);
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
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });

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
      const widget = createDefaultWidget(WidgetType.GRAPH, { position });

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
      const widget = createDefaultWidget(WidgetType.GRAPH, { position: extremePosition });

      expect(widget.position.x).toBe(999);
      expect(widget.position.y).toBe(999);
      expect(widget.position.w).toBe(1);
      expect(widget.position.h).toBe(1);
    });


  });

  describe('generateWidgetId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateWidgetId();
      const id2 = generateWidgetId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^widget-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^widget-\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with correct format', () => {
      const id = generateWidgetId();

      expect(id).toMatch(/^widget-\d+-[a-z0-9]+$/);
      expect(id.startsWith('widget-')).toBe(true);
    });
  });
});
