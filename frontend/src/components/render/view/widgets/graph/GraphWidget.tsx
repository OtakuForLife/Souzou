/**
 * GraphWidget - Graph visualization widget using Cytoscape
 */

import React, { useMemo, useEffect, useState, memo, useRef, useCallback } from 'react';
import ReactCytoscape from '@/components/Cytoscape';
import { GraphWidgetConfig } from '@/types/widgetTypes';
import { linkParsingService } from '@/services/linkParsingService';
import { useStableLinkData } from '@/hooks/useStableLinkData';
import { LinkEntityData } from '@/store/slices/entityLinkSlice';
import { Core } from 'cytoscape';

// Link types for graph edges
enum LinkType {
  MARKDOWN = 'markdown',
  CHILD_TO_PARENT = 'child-to-parent'
}

// Traversal context for recursive graph building
interface TraversalContext {
  visitedEntities: Set<string>;
  nodes: Map<string, any>;
  edges: Map<string, any>;
  maxDepth: number;
}

// Entity with depth information for hierarchy-based traversal
interface EntityWithDepth {
  entity: LinkEntityData;
  depth: number;
}

interface GraphWidgetProps {
  widget: GraphWidgetConfig;
  mode?: 'render' | 'config';
  onUpdate?: (updates: Partial<GraphWidgetConfig>) => void;
  onDelete?: () => void;
}

// Helper function to get all children of an entity
const getChildEntities = (entityId: string, allEntities: Record<string, LinkEntityData>): LinkEntityData[] => {
  return Object.values(allEntities).filter(entity => entity.parent === entityId);
};

// Helper function to create edge ID
const createEdgeId = (sourceId: string, targetId: string, linkType: LinkType): string => {
  return `${sourceId}-${targetId}-${linkType}`;
};

// Helper function to add node to context
const addNodeToContext = (entity: LinkEntityData, depth: number, context: TraversalContext): void => {
  if (!context.nodes.has(entity.id)) {
    context.nodes.set(entity.id, {
      data: {
        id: entity.id,
        label: entity.title,
        type: entity.type,
        depth: depth,
      }
    });
  }
};

// Helper function to add edge to context (only if both nodes exist)
const addEdgeToContext = (sourceId: string, targetId: string, linkType: LinkType, context: TraversalContext): void => {
  // Only add edge if both source and target nodes exist in the graph
  if (!context.nodes.has(sourceId) || !context.nodes.has(targetId)) {
    return;
  }

  const edgeId = createEdgeId(sourceId, targetId, linkType);
  if (!context.edges.has(edgeId)) {
    context.edges.set(edgeId, {
      data: {
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: linkType,
      }
    });
  }
};

const GraphWidget: React.FC<GraphWidgetProps> = memo(({
  widget,
}) => {
  // Use stable link data that only changes when actual link data changes
  const { linkData, rootEntities } = useStableLinkData();
  const [graphElements, setGraphElements] = useState<any[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const cyRef = useRef<Core | null>(null);

  // Configuration for zoom-based label visibility
  const LABEL_HIDE_ZOOM_THRESHOLD = 0.75; // Hide labels when zoom is below this level

  // DEBUG: Log when GraphWidget renders (remove in production)
  // console.log('🔍 GraphWidget render - widget.id:', widget.id);

  // Callback to handle cytoscape instance reference
  const handleCyRef = useCallback((cy: Core | null) => {
    if (cy && cy !== cyRef.current) {
      cyRef.current = cy;

      // Set initial zoom level
      setCurrentZoom(cy.zoom());

      // Listen for zoom events
      cy.on('zoom', () => {
        const newZoom = cy.zoom();
        setCurrentZoom(newZoom);
      });

      // Cleanup function for when component unmounts or cy changes
      return () => {
        if (cyRef.current) {
          cyRef.current.removeAllListeners();
        }
      };
    }
  }, []);

  // Generate graph elements based on widget configuration
  useEffect(() => {
    const generateGraphElements = () => {
      const { rootEntityId, maxDepth } = widget.config;
      const effectiveMaxDepth = maxDepth || 2;

      // Initialize traversal context
      const context: TraversalContext = {
        visitedEntities: new Set(),
        nodes: new Map(),
        edges: new Map(),
        maxDepth: effectiveMaxDepth,
      };

      // Determine starting entities (root entities or specific entity)
      const startingEntities: EntityWithDepth[] = rootEntityId && linkData[rootEntityId]
        ? [{ entity: linkData[rootEntityId], depth: 0 }]
        : rootEntities.map(entity => ({ entity, depth: 0 }));

      if (startingEntities.length === 0) {
        return [];
      }

      // Process entities level by level (breadth-first for proper depth control)
      const entityQueue: EntityWithDepth[] = [...startingEntities];

      while (entityQueue.length > 0) {
        const { entity, depth } = entityQueue.shift()!;

        // Skip if already processed or depth exceeded
        if (context.visitedEntities.has(entity.id) || depth > effectiveMaxDepth) {
          continue;
        }

        // Mark as visited and add node
        context.visitedEntities.add(entity.id);
        addNodeToContext(entity, depth, context);

        // Process markdown links from entity content
        if (entity.content) {
          const linkResult = linkParsingService.parseLinks(entity.content, linkData as any);

          linkResult.links.forEach(link => {
            if (link.targetNoteId && linkData[link.targetNoteId]) {
              const targetEntity = linkData[link.targetNoteId];

              // Add target node if not already added and within depth limit
              if (!context.visitedEntities.has(link.targetNoteId) && depth < effectiveMaxDepth) {
                addNodeToContext(targetEntity, depth + 1, context);
                entityQueue.push({ entity: targetEntity, depth: depth + 1 });
              }

              // Add markdown link edge (now both nodes should exist)
              addEdgeToContext(entity.id, link.targetNoteId, LinkType.MARKDOWN, context);
            }
          });
        }

        // Process parent relationship (child → parent)
        if (entity.parent && linkData[entity.parent]) {
          const parentEntity = linkData[entity.parent];

          // Add parent node if not already added and within depth limit
          if (!context.visitedEntities.has(entity.parent) && depth < effectiveMaxDepth) {
            addNodeToContext(parentEntity, depth + 1, context);
            entityQueue.push({ entity: parentEntity, depth: depth + 1 });
          }

          // Add child-to-parent edge (now both nodes should exist)
          addEdgeToContext(entity.id, entity.parent, LinkType.CHILD_TO_PARENT, context);
        }

        // Process children relationships (discover all children)
        const childEntities = getChildEntities(entity.id, linkData);
        childEntities.forEach(childEntity => {
          // Add child node if not already added and within depth limit
          if (!context.visitedEntities.has(childEntity.id) && depth < effectiveMaxDepth) {
            addNodeToContext(childEntity, depth + 1, context);
            entityQueue.push({ entity: childEntity, depth: depth + 1 });
          }

          // Add child-to-parent edge (child → parent, now both nodes should exist)
          addEdgeToContext(childEntity.id, entity.id, LinkType.CHILD_TO_PARENT, context);
        });
      }

      // Convert Maps to arrays for Cytoscape
      return [...Array.from(context.nodes.values()), ...Array.from(context.edges.values())];
    };

    setGraphElements(generateGraphElements());
  }, [widget.config, linkData, rootEntities]);

  // Memoize layout configuration
  const layout = useMemo(() => ({
    name: widget.config.layoutAlgorithm,
    fit: true,
    padding: 30,
    animate: true,
    animationDuration: 500,
  }), [widget.config.layoutAlgorithm]);

  // Get current theme colors from CSS variables
  const getThemeColor = (cssVar: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
      return value || fallback;
    }
    return fallback;
  };

  // Memoize style configuration
  const style = useMemo(() => {
    const textColor = getThemeColor('--color-main-content-text', '#ffffff');
    const backgroundColor = getThemeColor('--color-explorer-background', '#666666');

    // Determine if labels should be visible based on zoom level and widget config
    const shouldShowLabels = widget.config.showLabels && currentZoom >= LABEL_HIDE_ZOOM_THRESHOLD;

    return [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          'label': shouldShowLabels ? 'data(label)' : '',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 10, // Add some spacing between node and label
          'color': textColor,
          'font-size': '11px',
          'font-weight': '600',
          'text-outline-width': 2,
          'text-outline-color': backgroundColor,
          'text-outline-opacity': 0.9,
          'text-max-width': '100px',
          'text-wrap': 'wrap',
          'text-background-color': backgroundColor,
          'text-background-opacity': 0.8,
          'text-background-padding': '2px',
          'text-border-radius': '3px',
          'width': widget.config.nodeSize,
          'height': widget.config.nodeSize,
        }
      },
      {
        selector: 'edge',
        style: {
          'width': widget.config.edgeWidth,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      },
      {
        selector: 'node[type="note"]',
        style: {
          'background-color': '#3b82f6',
        }
      },
      {
        selector: 'node[type="view"]',
        style: {
          'background-color': '#10b981',
        }
      },
      {
        selector: 'edge[type="markdown"]',
        style: {
          'line-color': '#3b82f6',
          'target-arrow-color': '#3b82f6',
          'line-style': 'solid',
        }
      },
      {
        selector: 'edge[type="child-to-parent"]',
        style: {
          'line-color': '#10b981',
          'target-arrow-color': '#10b981',
          'line-style': 'dashed',
        }
      }
    ];
  }, [widget.config, currentZoom]);

  // Memoize cytoscape options
  const cytoscapeOptions = useMemo(() => ({
    boxSelectionEnabled: true,
    autounselectify: false,
    userZoomingEnabled: true,
    userPanningEnabled: true,
  }), []);

  // Memoize style container
  const styleContainer = useMemo(() => ({
    height: '100%',
    width: '100%'
  }), []);

  return (
    <div className="h-full w-full">
      <ReactCytoscape
        containerID={`graph-widget-${widget.id}`}
        elements={graphElements}
        layout={layout}
        style={style}
        styleContainer={styleContainer}
        cytoscapeOptions={cytoscapeOptions}
        cyRef={handleCyRef}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only rerender if widget config actually changes
  return JSON.stringify(prevProps.widget.config) === JSON.stringify(nextProps.widget.config) &&
         prevProps.widget.id === nextProps.widget.id;
});

export default GraphWidget;
