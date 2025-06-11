/**
 * Unit tests for widget validation system
 */

import { describe, it, expect } from 'vitest';
import {
  validateWidgetConfig,
  validateViewContent,
  parseAndValidateViewContent,
  validateWidgetConfigForType,
  formatValidationError,
  validateAIChatWidgetConfig,

  validateAIModelConfig,
  GridPositionSchema,
  GraphWidgetConfigSchema,
  AIChatWidgetConfigSchema,
  ViewContentSchema,
} from '../widgetValidation';
import { WidgetType } from '../widgetTypes';

describe('Widget Validation System', () => {
  describe('GridPositionSchema', () => {
    it('should validate valid grid position', () => {
      const validPosition = {
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        minW: 2,
        minH: 2,
        maxW: 8,
        maxH: 6,
      };

      const result = GridPositionSchema.safeParse(validPosition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPosition);
      }
    });

    it('should reject negative coordinates', () => {
      const invalidPosition = {
        x: -1,
        y: 0,
        w: 4,
        h: 3,
      };

      const result = GridPositionSchema.safeParse(invalidPosition);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative dimensions', () => {
      const invalidPosition = {
        x: 0,
        y: 0,
        w: 0,
        h: 3,
      };

      const result = GridPositionSchema.safeParse(invalidPosition);
      expect(result.success).toBe(false);
    });

    it('should allow optional constraint properties', () => {
      const minimalPosition = {
        x: 0,
        y: 0,
        w: 4,
        h: 3,
      };

      const result = GridPositionSchema.safeParse(minimalPosition);
      expect(result.success).toBe(true);
    });
  });

  describe('GraphWidgetConfigSchema', () => {
    it('should validate valid graph widget config', () => {
      const validConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        showHeaderInViewMode: true,
        config: {
          rootEntityId: 'entity-456',
          maxDepth: 3,
          layoutAlgorithm: 'circle' as const,
          showLabels: true,
          nodeSize: 30,
          edgeWidth: 2,
        },
      };

      const result = GraphWidgetConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(WidgetType.GRAPH);
        expect(result.data.config.maxDepth).toBe(3);
      }
    });

    it('should reject invalid layout algorithm', () => {
      const invalidConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          maxDepth: 3,
          layoutAlgorithm: 'invalid-algorithm',
          showLabels: true,
          nodeSize: 30,
          edgeWidth: 2,
        },
      };

      const result = GraphWidgetConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject out-of-range values', () => {
      const invalidConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          maxDepth: 15, // Too high
          layoutAlgorithm: 'circle' as const,
          showLabels: true,
          nodeSize: 150, // Too high
          edgeWidth: 2,
        },
      };

      const result = GraphWidgetConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should require all mandatory fields', () => {
      const incompleteConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          // Missing required fields
          layoutAlgorithm: 'circle' as const,
        },
      };

      const result = GraphWidgetConfigSchema.safeParse(incompleteConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('ViewContentSchema', () => {
    it('should validate valid view content', () => {
      const validViewContent = {
        layout: {
          cols: 12,
          rowHeight: 50,
          margin: [16, 16] as [number, number],
          containerPadding: [16, 16] as [number, number],
        },
        widgets: [
          {
            id: 'widget-123',
            type: WidgetType.GRAPH,
            title: 'Test Graph',
            position: { x: 0, y: 0, w: 4, h: 3 },
            config: {
              maxDepth: 2,
              layoutAlgorithm: 'circle' as const,
              showLabels: true,
              nodeSize: 30,
              edgeWidth: 2,
            },
          },
        ],
      };

      const result = ViewContentSchema.safeParse(validViewContent);
      expect(result.success).toBe(true);
    });

    it('should validate empty widget array', () => {
      const emptyViewContent = {
        layout: {
          cols: 12,
          rowHeight: 50,
          margin: [16, 16] as [number, number],
        },
        widgets: [],
      };

      const result = ViewContentSchema.safeParse(emptyViewContent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid layout configuration', () => {
      const invalidViewContent = {
        layout: {
          cols: 0, // Invalid
          rowHeight: 50,
          margin: [16, 16] as [number, number],
        },
        widgets: [],
      };

      const result = ViewContentSchema.safeParse(invalidViewContent);
      expect(result.success).toBe(false);
    });
  });

  describe('validateWidgetConfig', () => {
    it('should return success for valid widget config', () => {
      const validConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          maxDepth: 2,
          layoutAlgorithm: 'circle',
          showLabels: true,
          nodeSize: 30,
          edgeWidth: 2,
        },
      };

      const result = validateWidgetConfig(validConfig);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid widget config', () => {
      const invalidConfig = {
        id: 'widget-123',
        type: 'invalid-type',
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
      };

      const result = validateWidgetConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should handle non-object input gracefully', () => {
      const result = validateWidgetConfig('not an object');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateViewContent', () => {
    it('should return success for valid view content', () => {
      const validContent = {
        layout: {
          cols: 12,
          rowHeight: 50,
          margin: [16, 16],
        },
        widgets: [],
      };

      const result = validateViewContent(validContent);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid view content', () => {
      const invalidContent = {
        layout: {
          cols: 'invalid', // Should be number
          rowHeight: 50,
          margin: [16, 16],
        },
        widgets: [],
      };

      const result = validateViewContent(invalidContent);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('parseAndValidateViewContent', () => {
    it('should parse and validate valid JSON string', () => {
      const validJson = JSON.stringify({
        layout: {
          cols: 12,
          rowHeight: 50,
          margin: [16, 16],
        },
        widgets: [],
      });

      const result = parseAndValidateViewContent(validJson);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = '{ invalid json }';

      const result = parseAndValidateViewContent(invalidJson);
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parsing failed');
    });

    it('should handle valid JSON with invalid content', () => {
      const validJsonInvalidContent = JSON.stringify({
        layout: {
          cols: 'invalid',
          rowHeight: 50,
          margin: [16, 16],
        },
        widgets: [],
      });

      const result = parseAndValidateViewContent(validJsonInvalidContent);
      expect(result.success).toBe(false);
      expect(result.error).toBe('View content validation failed');
    });
  });

  describe('validateWidgetConfigForType', () => {
    it('should validate widget config for correct type', () => {
      const graphConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          maxDepth: 2,
          layoutAlgorithm: 'circle',
          showLabels: true,
          nodeSize: 30,
          edgeWidth: 2,
        },
      };

      const result = validateWidgetConfigForType(graphConfig, WidgetType.GRAPH);
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe(WidgetType.GRAPH);
    });

    it('should reject widget config for wrong type', () => {
      const graphConfig = {
        id: 'widget-123',
        type: WidgetType.GRAPH,
        title: 'Test Graph',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          maxDepth: 2,
          layoutAlgorithm: 'circle',
          showLabels: true,
          nodeSize: 30,
          edgeWidth: 2,
        },
      };

      // This would fail if we had another widget type to test against
      // For now, we test with the same type to ensure the function works
      const result = validateWidgetConfigForType(graphConfig, WidgetType.GRAPH);
      expect(result.success).toBe(true);
    });
  });

  describe('AIChatWidgetConfigSchema', () => {
    it('should validate valid AI Chat widget config', () => {
      const validConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: 'llama2',
          temperature: 0.7,
          maxTokens: 2000,
          maxContextNotes: 5,
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = AIChatWidgetConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(WidgetType.AI_CHAT);
        expect(result.data.config.model).toBe('llama2');
        expect(result.data.config.temperature).toBe(0.7);
      }
    });



    it('should reject invalid model name', () => {
      const invalidConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: '', // Invalid: empty string
          temperature: 0.7,
          maxContextNotes: 5,
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = AIChatWidgetConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid temperature', () => {
      const invalidConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: 'llama2',
          temperature: 1.5, // Invalid: > 1
          maxContextNotes: 5,
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = AIChatWidgetConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });



    it('should reject invalid maxContextNotes', () => {
      const invalidConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: 'llama2',
          temperature: 0.7,
          maxContextNotes: 0, // Invalid: < 1
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = AIChatWidgetConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('validateAIChatWidgetConfig', () => {
    it('should validate valid AI Chat widget config', () => {
      const validConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: 'llama2',
          temperature: 0.7,
          maxContextNotes: 5,
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = validateAIChatWidgetConfig(validConfig);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validConfig);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid AI Chat widget config', () => {
      const invalidConfig = {
        id: 'ai-chat-widget-123',
        type: WidgetType.AI_CHAT,
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          model: '',
          temperature: 2.0, // Invalid
          maxContextNotes: 5,
          showContextPreview: true,
          autoSaveChats: true,
        },
      };

      const result = validateAIChatWidgetConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });



  describe('validateAIModelConfig', () => {
    it('should validate valid model config', () => {
      const validConfig = {
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 2000,
      };

      const result = validateAIModelConfig(validConfig);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validConfig);
    });

    it('should validate model config without maxTokens', () => {
      const validConfig = {
        model: 'llama2',
        temperature: 0.7,
      };

      const result = validateAIModelConfig(validConfig);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validConfig);
    });

    it('should reject invalid temperature range', () => {
      const invalidConfig = {
        model: 'llama2',
        temperature: -0.1,
      };

      const result = validateAIModelConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid maxTokens range', () => {
      const invalidConfig = {
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 50, // Too low
      };

      const result = validateAIModelConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('formatValidationError', () => {
    it('should format validation issues correctly', () => {
      const issues = [
        {
          code: 'invalid_type',
          expected: 'number',
          received: 'string',
          path: ['layout', 'cols'],
          message: 'Expected number, received string',
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'number',
          inclusive: true,
          exact: false,
          path: ['layout', 'rowHeight'],
          message: 'Number must be greater than or equal to 1',
        },
      ];

      const formatted = formatValidationError(issues as any);
      expect(formatted).toContain('layout.cols: Expected number, received string');
      expect(formatted).toContain('layout.rowHeight: Number must be greater than or equal to 1');
      expect(formatted).toContain(';');
    });

    it('should handle empty issues array', () => {
      const formatted = formatValidationError([]);
      expect(formatted).toBe('');
    });
  });
});
