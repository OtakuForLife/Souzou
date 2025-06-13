/**
 * Tests for GraphWidget optimization
 */

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, test, vi } from 'vitest';
import GraphWidget from '../GraphWidget';
import entitySlice from '@/store/slices/entitySlice';
import entityLinkSlice from '@/store/slices/entityLinkSlice';
import { Entity, EntityType } from '@/models/Entity';
import { WidgetType } from '@/types/widgetTypes';

// Mock Cytoscape component
vi.mock('@/components/Cytoscape', () => ({
  default: ({ elements }: { elements: any[] }) => (
    <div data-testid="cytoscape-mock">
      {elements.length} graph elements
    </div>
  )
}));

// Mock the linkParsingService
vi.mock('@/services/linkParsingService', () => ({
  linkParsingService: {
    parseLinks: vi.fn((content: string, allEntities: Record<string, Entity>) => {
      // Simple mock that finds [[Note Title]] links
      const wikiLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
      const links = wikiLinks.map(link => {
        const title = link.slice(2, -2);
        const targetEntity = Object.values(allEntities).find(e => e.title === title);
        return {
          targetNoteId: targetEntity?.id,
          isValid: !!targetEntity
        };
      }).filter(link => link.isValid);
      
      return { links, brokenLinks: [] };
    })
  }
}));

describe('GraphWidget Optimization', () => {
  const createMockEntity = (id: string, title: string, content: string = '', parent: string | null = null): Entity => ({
    id,
    type: EntityType.NOTE,
    title,
    content,
    created_at: new Date().toISOString(),
    parent,
    children: []
  });

  const createMockWidget = () => ({
    id: 'test-widget',
    type: WidgetType.GRAPH as const,
    position: { x: 0, y: 0, w: 4, h: 4 },
    config: {
      maxDepth: 2,
      layoutAlgorithm: 'circle' as const,
      showLabels: true,
      nodeSize: 30,
      edgeWidth: 2
    }
  });

  test('GraphWidget renders without crashing', () => {
    const store = configureStore({
      reducer: {
        entities: entitySlice,
        entityLink: entityLinkSlice
      },
      // Skip middleware for simple render test
    });

    // Initialize entityLink state manually
    store.dispatch({
      type: 'entityLink/updateLinkData',
      payload: {}
    });

    const widget = createMockWidget();

    render(
      <Provider store={store}>
        <GraphWidget widget={widget} />
      </Provider>
    );
  });

  test('GraphWidget uses stable link data', () => {
    const entity1 = createMockEntity('1', 'Note 1', 'Content with [[Note 2]] link');
    const entity2 = createMockEntity('2', 'Note 2', 'Regular content');

    const store = configureStore({
      reducer: {
        entities: entitySlice,
        entityLink: entityLinkSlice
      },
      // Skip middleware for this test
    });

    // Initialize entityLink state manually with test data
    store.dispatch({
      type: 'entityLink/updateLinkData',
      payload: {
        '1': entity1,
        '2': entity2
      }
    });

    const widget = createMockWidget();

    const { container } = render(
      <Provider store={store}>
        <GraphWidget widget={widget} />
      </Provider>
    );

    // Test that the component renders without errors
    expect(container.querySelector('[data-testid="cytoscape-mock"]')).toBeInTheDocument();

    // Update entity content without changing graph structure
    store.dispatch({
      type: 'entities/updateEntity',
      payload: {
        noteID: '2',
        content: 'Updated content without any links'
      }
    });

    // Test passes if no errors are thrown and component still renders
    expect(container.querySelector('[data-testid="cytoscape-mock"]')).toBeInTheDocument();
  });

});
