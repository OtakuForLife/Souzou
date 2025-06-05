/**
 * GraphWidget - Graph visualization widget using Cytoscape
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactCytoscape from '@/components/Cytoscape';
import { GraphWidgetConfig } from '@/types/widgetTypes';
import { RootState } from '@/store';
import { linkParsingService } from '@/services/linkParsingService';
import { Entity } from '@/models/Entity';

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
  entity: Entity;
  depth: number;
}

interface GraphWidgetProps {
  widget: GraphWidgetConfig;
  mode?: 'render' | 'config';
  onUpdate?: (updates: Partial<GraphWidgetConfig>) => void;
  onDelete?: () => void;
}

// Helper function to get all children of an entity
const getChildEntities = (entityId: string, allEntities: Record<string, Entity>): Entity[] => {
  return Object.values(allEntities).filter(entity => entity.parent === entityId);
};

// Helper function to create edge ID
const createEdgeId = (sourceId: string, targetId: string, linkType: LinkType): string => {
  return `${sourceId}-${targetId}-${linkType}`;
};

// Helper function to add node to context
const addNodeToContext = (entity: Entity, depth: number, context: TraversalContext): void => {
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

// Helper function to add edge to context
const addEdgeToContext = (sourceId: string, targetId: string, linkType: LinkType, context: TraversalContext): void => {
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

const GraphWidget: React.FC<GraphWidgetProps> = ({
  widget,
}) => {
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const rootEntities = useSelector((state: RootState) => state.entities.rootEntities);
  const [graphElements, setGraphElements] = useState<any[]>([]);

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
      const startingEntities: EntityWithDepth[] = rootEntityId && allEntities[rootEntityId]
        ? [{ entity: allEntities[rootEntityId], depth: 0 }]
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
          const linkResult = linkParsingService.parseLinks(entity.content, allEntities);

          linkResult.links.forEach(link => {
            if (link.targetNoteId && allEntities[link.targetNoteId]) {
              const targetEntity = allEntities[link.targetNoteId];

              // Add markdown link edge
              addEdgeToContext(entity.id, link.targetNoteId, LinkType.MARKDOWN, context);

              // Queue target entity for next level if not visited
              if (!context.visitedEntities.has(link.targetNoteId) && depth < effectiveMaxDepth) {
                entityQueue.push({ entity: targetEntity, depth: depth + 1 });
              }
            }
          });
        }

        // Process parent relationship (child → parent)
        if (entity.parent && allEntities[entity.parent]) {
          const parentEntity = allEntities[entity.parent];

          // Add child-to-parent edge
          addEdgeToContext(entity.id, entity.parent, LinkType.CHILD_TO_PARENT, context);

          // Queue parent entity for next level if not visited
          if (!context.visitedEntities.has(entity.parent) && depth < effectiveMaxDepth) {
            entityQueue.push({ entity: parentEntity, depth: depth + 1 });
          }
        }

        // Process children relationships (discover all children)
        const childEntities = getChildEntities(entity.id, allEntities);
        childEntities.forEach(childEntity => {
          // Add child-to-parent edge (child → parent)
          addEdgeToContext(childEntity.id, entity.id, LinkType.CHILD_TO_PARENT, context);

          // Queue child entity for next level if not visited
          if (!context.visitedEntities.has(childEntity.id) && depth < effectiveMaxDepth) {
            entityQueue.push({ entity: childEntity, depth: depth + 1 });
          }
        });
      }

      // Convert Maps to arrays for Cytoscape
      return [...Array.from(context.nodes.values()), ...Array.from(context.edges.values())];
    };

    setGraphElements(generateGraphElements());
  }, [widget.config, allEntities, rootEntities]);

  // Memoize layout configuration
  const layout = useMemo(() => ({
    name: widget.config.layoutAlgorithm,
    fit: true,
    padding: 30,
    animate: true,
    animationDuration: 500,
  }), [widget.config.layoutAlgorithm]);

  // Memoize style configuration
  const style = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': widget.config.showLabels ? 'data(label)' : '',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff',
        'font-size': '12px',
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
  ], [widget.config]);

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
      />
    </div>
  );
};

export default GraphWidget;
